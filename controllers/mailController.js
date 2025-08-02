import sendMailTo from '../utils/sendMail.js';

export const sendMail = async (req, res) => {
    try {
        const { name, email, service, message } = req.body;

        if (!name || !email || !service || !message) {
            return res.status(400).json({ error: 'All fields are required.' });
        }

        try {
            await sendMailTo('', '', { name, email, service, message });
            res.status(200).json({ message: 'Email sent successfully!' });
        } catch (mailError) {
            console.error('Error sending email:', mailError);
            res.status(500).json({ message: 'Failed to send PIN email. Please try again later.' });
        }
    } catch (error) {
        console.error('Error in sendMail:', error);
        res.status(500).json({ error: 'Failed to send email. Please try again later.' });
    }
};
