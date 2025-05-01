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