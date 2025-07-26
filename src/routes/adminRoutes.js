const router = require("express").Router();
const AdminController = require("../controllers/adminController");
const authMiddleware = require("../middlewares/auth");
const fileUpload = require("../middlewares/fileUpload");
const { body, param } = require("express-validator");
const validationResultMiddleware = require("../middlewares/validationResultMiddleware");

// Roles and permissions
router.post(
  "/role",
  body("name").notEmpty().withMessage("Name is required"),
  validationResultMiddleware,
  AdminController.addRole
);

router.put(
  "/role/:id",
  body("name").notEmpty().withMessage("Name is required"),
  validationResultMiddleware,
  AdminController.editRole
);
router.delete("/role/:id", AdminController.deleteRole);

router.post(
  "/assign-role",
  body("user_id").notEmpty().withMessage("user_id is required"),
  body("role_id").notEmpty().withMessage("role_id is required"),
  validationResultMiddleware,
  AdminController.assignRoleToUser
);
// Roles and permissions End

router.get("/roles", AdminController.getRoles);
router.get("/users", AdminController.getUsers);
router.get("/roles-permissions", AdminController.getRolesAndPermissions);
router.post(
  "/user",
  body("name").notEmpty().withMessage("Name is required"),
  body("email").notEmpty().withMessage("Email is required"),
  body("password").notEmpty().withMessage("Password is required"),
  body("role_id").notEmpty().withMessage("Role id is required"),
  validationResultMiddleware,
  AdminController.addUser
);

router.put(
  "/user/:id",
  body("id").notEmpty().withMessage("Id is required"),
  body("name").notEmpty().withMessage("Name is required"),
  body("email").notEmpty().withMessage("Email is required"),
  body("role_id").notEmpty().withMessage("Role id is required"),
  body("status").notEmpty().withMessage("Status is required"),
  validationResultMiddleware,
  AdminController.updateUser
);


module.exports = router;
