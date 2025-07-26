const bcrypt = require("bcrypt");
const User = require("../models/User");
const Role = require("../models/Role");
const sendEmail = require("../utils/emails/sendEmail");
const clientURL = process.env.CLIENT_URL;
const { successResponse, errorResponse } = require("../utils/functions");
const moment = require('moment')

// Function to handle adding a new role
async function addRole(req, res) {
  try {
    const { name, permissions = [] } = req.body;
    if (name === "admin")
      return res.status(400).json(errorResponse("Admin role cannot be added"));

    const role = new Role({ name, permissions });
    await role.save();

    return res
      .status(201)
      .json(successResponse("Role added successfully", { role }));
  } catch (error) {
    let message = "Something went wrong.";
    console.error(error);
    return res.status(400).json(errorResponse(message));
  }
}

// Function to handle editing an existing role
async function editRole(req, res) {
  try {
    const roleId = req.params.id;
    const { name, permissions = [] } = req.body;

    const role = await Role.findById(roleId);

    if (!role) {
      return res.status(404).json(errorResponse("Role not found"));
    }

    role.permissions = permissions;
    if (role.name !== "admin" && role.name !== name) {
      role.name = name;
    }
    await role.save();

    return res
      .status(200)
      .json(successResponse("Role updated successfully", { role }));
  } catch (error) {
    let message = "Something went wrong.";
    console.error(error);
    return res.status(400).json(errorResponse(message));
  }
}

// Function to handle deleting a role
async function deleteRole(req, res) {
  try {
    const roleId = req.params.role_id;

    const role = await Role.findById(roleId);

    if (!role) {
      return res.status(404).json(errorResponse("Role not found"));
    }
    if (role.name === "admin")
      return res
        .status(400)
        .json(errorResponse("Admin role cannot be deleted"));

    await role.remove();

    return res.status(200).json(successResponse("Role deleted successfully"));
  } catch (error) {
    let message = "Something went wrong.";
    console.error(error);
    return res.status(400).json(errorResponse(message));
  }
}

// Function to handle assigning a role to a user
async function assignRoleToUser(req, res) {
  try {
    const { user_id, role_id } = req.body;

    const user = await User.findById(user_id);
    const role = await Role.findById(role_id);

    if (!user) {
      return res.status(404).json(errorResponse("User not found"));
    }

    if (!role) {
      return res.status(404).json(errorResponse("Role not found"));
    }

    user.role_id = role_id;
    await user.save();

    return res
      .status(200)
      .json(successResponse("Role assigned to user successfully", { user }));
  } catch (error) {
    let message = "Something went wrong.";
    console.error(error);
    return res.status(400).json(errorResponse(message));
  }
}

// Function to handle fetching users
async function getUsers(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 50;
    const { search, status, roleId } = req.query;

    const adminRole = await Role.findOne({ name: "admin" });

    let query = { role_id: { $ne: adminRole._id } };
    if (status) {
      query.status = status;
    }
    if (roleId) {
      query.role_id = roleId;
    }
    if (search) {
      query.$or = [
        { name: new RegExp(search, "i") },
        { email: new RegExp(search, "i") },
      ];
    }

    const users = await User.find(query)
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .sort({ createdAt: -1 })
      .populate("role_id", "id name");

    const totalRecords = await User.countDocuments(query);
    const totalPages = Math.ceil(totalRecords / pageSize);

    return res.status(200).json(
      successResponse("Users fetched successfully", {
        users,
        pagination: {
          totalRecords,
          totalPages,
          currentPage: page,
        },
      })
    );
  } catch (error) {
    let message = "Something went wrong.";
    console.error(error);
    return res.status(400).json(errorResponse(message));
  }
}

// Function to handle fetching roles
async function getRoles(req, res) {
  try {
    const roles = await Role.find().sort({ createdAt: -1 });

    return res
      .status(200)
      .json(successResponse("Roles fetched successfully", { roles }));
  } catch (error) {
    let message = "Something went wrong.";
    console.error(error);
    return res.status(400).json(errorResponse(message));
  }
}

// Function to handle fetching roles and permissions
async function getRolesAndPermissions(req, res) {
  try {
    const roles = await Role.find().sort({ createdAt: -1 });

    for (let i = 0; i < roles.length; i++) {
      roles[i] = roles[i].toJSON();
      roles[i].associatedUsers = await User.countDocuments({
        role_id: roles[i]._id,
      });
    }

    return res
      .status(200)
      .json(
        successResponse("Roles and Permissions fetched successfully", { roles })
      );
  } catch (error) {
    let message = "Something went wrong.";
    console.error(error);
    return res.status(400).json(errorResponse(message));
  }
}

// Function to handle adding a new user
const addUser = async (req, res) => {
  try {
    const { name, email, password, role_id, status = "active" } = req.body;

    const role = await Role.findById(role_id);
    if (!role) {
      return res.status(400).json(errorResponse("Invalid Role", { role_id }));
    }

    const oldUser = await User.findOne({ email: email });
    if (oldUser) {
      return res.status(400).json(errorResponse("Email is already taken"));
    }

    let hashPassword = await bcrypt.hash(password, 10);

    let user = new User({
      name,
      email,
      password: hashPassword,
      role_id,
      status,
    });
    await user.save();

    return res
      .status(200)
      .json(successResponse("Registration successful.", { user }));
  } catch (error) {
    let message = "Something went wrong.";
    console.error(error);
    return res.status(400).json(errorResponse(message));
  }
};

// Function to handle updating a user
const updateUser = async (req, res) => {
  try {
    const { name, email, role_id, status } = req.body;
    const id = req.params.id;

    const role = await Role.findById(role_id);
    if (!role) {
      return res.status(400).json(errorResponse("Invalid Role", { role_id }));
    }

    const oldUser = await User.findOne({ email: email, _id: { $ne: id } });
    if (oldUser) {
      return res.status(400).json(errorResponse("Email is already taken"));
    }

    let user = await User.findById(id);
    if (!user) {
      return res.status(404).json(errorResponse("User not found"));
    }

    user.name = name;
    user.email = email;
    user.role_id = role_id;
    user.status = status;
    await user.save();

    return res
      .status(200)
      .json(successResponse("User updated successfully.", { user }));
  } catch (error) {
    let message = "Something went wrong.";
    console.error(error);
    return res.status(400).json(errorResponse(message));
  }
};


module.exports = {
  addRole,
  editRole,
  deleteRole,
  assignRoleToUser,
  addUser,
  updateUser,
  getUsers,
  getRoles,
  getRolesAndPermissions,
};
