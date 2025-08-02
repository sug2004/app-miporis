import User from "../models/UserModel.js";

export async function updateUserSubscription(userId, planId, currentPeriodEnd, subId) {
    try {
        const user = await User.findOne({ _id: userId });

        if (user) {
            user.subscription = planId;
            user.subscriptionValid = currentPeriodEnd;
            user.subscriptionId = subId;
            await user.save();
        } else {
            console.log(`User with id ${userId} not found.`);
        }
    } catch (error) {
        console.error(`Error updating user subscription: ${error}`);
    }
}
