// Track user views, purchases, wishlist additions, etc.
async function track(userId, itemId, behaviorType, metadata = {}) {
    if (!userId || !itemId) return;

    const behaviorKey = `${userId}:${behaviorType}`;
    const timestamp = Date.now();

    // Get existing behaviors
    let behaviors = await MAIN.userBehaviorStore.userid(userId).get(behaviorType) || [];

    // Add new behavior with timestamp
    behaviors.push({
        itemId,
        timestamp,
        ...metadata
    });

    // Keep only the last 100 behaviors of this type
    if (behaviors.length > 100) {
        behaviors = behaviors.slice(-100);
    }

    // Save updated behaviors
    await MAIN.userBehaviorStore.userid(userId).set(behaviorType, behaviors);
}

// Function to track specific behaviors
FUNC.trackView = async function (userId, itemId, metadata = {}) {
    return track(userId, itemId, 'views', metadata);
};

FUNC.trackPurchase = async function (userId, itemId, metadata = {}) {
    return track(userId, itemId, 'purchases', metadata);
};

FUNC.trackWishlist = async function (userId, itemId, metadata = {}) {
    return track(userId, itemId, 'wishlist', metadata);
};

FUNC.trackCart = async function (userId, itemId, metadata = {}) {
    return track(userId, itemId, 'cart', metadata);
};


// Generate recommendations for a user
async function generateRecommendations(userId) {
    if (!userId) return [];

    // Check if recommendations already exist and are fresh
    const existingRecommendations = await MAIN.recommendationStore.userid(userId).get('personalized');
    if (existingRecommendations) {
        return existingRecommendations;
    }

    // Collect user behaviors
    const views = await MAIN.userBehaviorStore.userid(userId).get('views') || [];
    const purchases = await MAIN.userBehaviorStore.userid(userId).get('purchases') || [];
    const wishlist = await MAIN.userBehaviorStore.userid(userId).get('wishlist') || [];
    const cart = await MAIN.userBehaviorStore.userid(userId).get('cart') || [];

    // Get user data from existing routes
    const userWishlist = await APICALL('Customer/Wishlist --> userlist')
        .params({ id: userId })
        .user({ id: userId, sa: false })
        .promise();

    const userCart = await APICALL('Customers/Cart --> usercart')
        .params({ id: userId })
        .user({ id: userId, sa: false })
        .promise();

    const userTags = await APICALL('Customer/Tags --> usertags')
        .params({ id: userId })
        .user({ id: userId, sa: false })
        .promise();

    const userOrders = await APICALL('Customers --> userorders')
        .params({ id: userId })
        .user({ id: userId, sa: false })
        .promise();

    // Create a score map for items based on user behavior
    const itemScores = {};

    // Helper function to update item scores
    function scoreItems(items, weight) {
        if (!items || !Array.isArray(items)) return;

        items.forEach(item => {
            const itemId = item.itemId || item.id;
            if (!itemId) return;

            if (!itemScores[itemId]) {
                itemScores[itemId] = {
                    id: itemId,
                    score: 0,
                    tags: item.tags || [],
                    category: item.category || null
                };
            }

            itemScores[itemId].score += weight;

            // Recency boost (newer interactions get higher scores)
            if (item.timestamp) {
                const hoursSinceInteraction = (Date.now() - item.timestamp) / (1000 * 60 * 60);
                const recencyBoost = Math.max(0, 1 - (hoursSinceInteraction / 168)); // 1 week decay
                itemScores[itemId].score += recencyBoost * (weight * 0.5);
            }
        });
    }

    scoreItems(views, 1);
    scoreItems(wishlist, 3);
    scoreItems(cart, 4);
    scoreItems(purchases, 5);

    if (userWishlist && Array.isArray(userWishlist)) {
        scoreItems(userWishlist, 3);
    }

    if (userCart && Array.isArray(userCart)) {
        scoreItems(userCart, 4);
    }

    if (userOrders && Array.isArray(userOrders)) {
        const recentOrders = userOrders
            .sort((a, b) => (b.dtcreated || 0) - (a.dtcreated || 0))
            .slice(0, 5);
        scoreItems(recentOrders, 5);
    }

    // Extract tags and categories from user interactions
    const userPreferredTags = {};
    const userPreferredCategories = {};

    Object.values(itemScores).forEach(item => {
        // Count tag occurrences
        if (item.tags && Array.isArray(item.tags)) {
            item.tags.forEach(tag => {
                userPreferredTags[tag] = (userPreferredTags[tag] || 0) + item.score;
            });
        }

        // Count category occurrences
        if (item.category) {
            userPreferredCategories[item.category] = (userPreferredCategories[item.category] || 0) + item.score;
        }
    });

    // Get popular/trending items to supplement recommendations
    let popularItems = await MAIN.recommendationStore.get('popular');
    if (!popularItems) {
        // If no popular items are cached, fetch them
        popularItems = await fetchPopularItems();
        await MAIN.recommendationStore.set('popular', popularItems);
    }

    // Find similar items based on tags and categories
    const similarItems = await fetchSimilarItems(userPreferredTags, userPreferredCategories);

    // Create final recommendation list
    let recommendations = Object.values(itemScores)
        .sort((a, b) => b.score - a.score)
        .slice(0, 20);

    // Add similar items that aren't already in recommendations
    const existingIds = new Set(recommendations.map(item => item.id));
    similarItems.forEach(item => {
        if (!existingIds.has(item.id)) {
            recommendations.push(item);
            existingIds.add(item.id);
        }
    });

    // Add popular items if we don't have enough recommendations
    if (recommendations.length < 20) {
        popularItems.forEach(item => {
            if (!existingIds.has(item.id) && recommendations.length < 20) {
                recommendations.push(item);
                existingIds.add(item.id);
            }
        });
    }

    // Limit to top 20 items
    recommendations = recommendations.slice(0, 20);

    // Store recommendations in Redis with TTL
    await MAIN.recommendationStore.userid(userId).set('personalized', recommendations);

    return recommendations;
}

// Helper function to fetch popular items
async function fetchPopularItems() {
    // This would typically be a database query or API call
    // For example, you might track view counts in your database
    // For now, we'll return a placeholder
    return [];
}

// Helper function to fetch similar items based on tags and categories
async function fetchSimilarItems(tags, categories) {
    // This would typically be a database query or API call
    // You could use vector similarity if you've vectorized your items
    // For now, we'll return a placeholder
    return [];
}

ON('ready', async function() {
    const userCart = await APICALL('Customers --> userfollowings').params({ id: '1c1jc001ax51d' }).user({ id: '1c1jc001ax51d' }).promise();
	console.log(userCart);
})