import ControlData from '../models/complianceModel.js';

export const updateComplianceRelevance = async (req, res) => {
    const { id, relevance } = req.body;

    if (!id || !relevance) {
        return res.status(400).json({ error: "ID and relevance are required" });
    }

    try {
        const updatedCompliance = await ControlData.findByIdAndUpdate(
            id,
            { Relevance: relevance },
            { new: true }
        );

        if (!updatedCompliance) {
            return res.status(404).json({ error: "Compliance not found" });
        }

        res.status(200).json(updatedCompliance);
    } catch (error) {
        console.error("Error updating compliance:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const dashBoardAnalytics = async (req, res) => {
    const { userId } = req.query;

    try {
        const analytics = await ControlData.aggregate([
            { $match: { userId } },
            {
                $group: {
                    _id: "$compliant_type",
                    total_count: { $sum: 1 },
                    total_result: {
                        $sum: { $cond: [{ $eq: ["$compliant_result", "C"] }, 1, 0] }
                    },
                    total_Relevance: {
                        $sum: { $cond: [{ $eq: ["$Relevance", "Y"] }, 1, 0] }
                    },
                    Compliance: {
                        $sum: { $cond: [{ $eq: ["$Compliance", "Y"] }, 1, 0] }
                    },
                    total_NC: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ["$compliant_result", "NC"] },
                                        { $eq: ["$Relevance", "Y"] }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            {
                $project: {
                    compliant_type: "$_id",
                    total_count: 1,
                    total_result: 1,
                    total_Relevance: 1,
                    Compliance: 1,
                    total_NC: 1,
                    percent: {
                        $cond: {
                            if: { $eq: ["$total_count", 0] },
                            then: 0,
                            else: { $multiply: [{ $divide: ["$total_result", "$total_count"] }, 100] }
                        }
                    },
                    _id: 0
                }
            }
        ]);

        res.json(analytics);
    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ error: 'An error occurred while fetching analytics.' });
    }
};
