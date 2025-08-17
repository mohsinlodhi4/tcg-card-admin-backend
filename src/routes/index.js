const router = require("express").Router();
const authMiddleware = require("../middlewares/auth");
const authRouter = require("./authRoutes");
const adminRoutes = require("./adminRoutes");
const fileRoutes = require("./fileRoutes");
const packRoutes = require("./packRoutes");

const adminMiddleware = require("../middlewares/admin");

router.use("/auth", authRouter);
router.use("/admin", authMiddleware, adminRoutes);
router.use("/files", fileRoutes);
router.use("/packs", packRoutes);


module.exports = router;
