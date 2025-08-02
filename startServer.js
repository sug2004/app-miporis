import { app } from "./server.js";

// Start the server
const port = process.env.PORT || 3002;
app.listen(port, () => {
    console.log(`Server started at http://localhost:${port}`);
});