const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");

const User = require("./models/User");
const Bill = require("./models/Bill");

const app = express();
const PORT = 3000;

connectDB();

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use("/css", express.static(path.join(__dirname, "..", "css")));
app.use(express.static(path.join(__dirname, "pages")));

/* HOME */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "pages", "index.html"));
});

/* LOGIN PAGE */
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "pages", "login.html"));
});

app.get("/signup", (req, res) => {
  res.sendFile(path.join(__dirname, "pages", "signup.html"));
});

app.post("/signup", async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.send(`
                <h3 style="color:red; text-align:center;">
                    User already exists
                </h3>
                <div style="text-align:center;">
                    <a href="/signup">Go back</a>
                </div>
            `);
    }

    // Create new user
    const newUser = new User({
      name,
      email,
      password,
      role: role || "user",
    });

    await newUser.save();

    res.send(`
            <h3 style="color:green; text-align:center;">
                Account created successfully
            </h3>
            <div style="text-align:center;">
                <a href="/login">Go to Login</a>
            </div>
        `);
  } catch (error) {
    console.error(error);
    res.send("Error creating account");
  }
});

/* LOGIN HANDLER */
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.send(`
                <h3 style="color:red; text-align:center;">
                    User not found
                </h3>
                <div style="text-align:center;">
                    <a href="/login">Go back</a>
                </div>
            `);
    }

    // Check password (plain for now)
    if (user.password !== password) {
      return res.send(`
                <h3 style="color:red; text-align:center;">
                    Incorrect password
                </h3>
                <div style="text-align:center;">
                    <a href="/login">Go back</a>
                </div>
            `);
    }

    // Role-based redirect
    if (user.role === "admin") {
      return res.redirect("/admin");
    } else {
      return res.redirect(`/user?email=${user.email}`);
    }
  } catch (error) {
    console.error(error);
    res.send("Login error");
  }
});

/* ADMIN PAGE */
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "pages", "admin.html"));
});

/* USER PAGE – VIEW & PAY BILLS */
app.get("/user", async (req, res) => {
  const userEmail = req.query.email;

  try {
    const bills = await Bill.find({ customerEmail: userEmail });

    let billRows = "";

    if (bills.length === 0) {
      billRows = `
        <tr>
          <td colspan="6">No bills found</td>
        </tr>
      `;
    } else {
      bills.forEach((bill) => {
        let actionButton = "";

        if (bill.status === "Unpaid") {
          actionButton = `
            <form method="POST" action="/user/pay" style="display:inline;">
              <input type="hidden" name="billId" value="${bill._id}">
              <input type="hidden" name="email" value="${userEmail}">
              <button type="submit" class="btn">Pay</button>
            </form>
          `;
        } else {
          actionButton = `<span style="color:green; font-weight:bold;">Paid</span>`;
        }

        billRows += `
          <tr>
            <td>${bill.billingMonth}</td>
            <td>${bill.unitsConsumed}</td>
            <td>${bill.ratePerUnit}</td>
            <td>${bill.totalAmount}</td>
            <td>${bill.status}</td>
            <td>${actionButton}</td>
          </tr>
        `;
      });
    }

    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>User Dashboard</title>
        <link rel="stylesheet" href="/css/style.css" />
      </head>
      <body>

        <div class="navbar">
          <div class="nav-title">Electricity Bill Payment System</div>
          <div class="nav-links">
            <a href="/">Home</a>
            <a href="/logout">Logout</a>
          </div>
        </div>

        <div class="welcome-section">
          <h1>User Dashboard</h1>
          <p>${userEmail}</p>
        </div>

        <div class="container">
          <div class="content-block">
            <h3>Your Electricity Bills</h3>

            <table class="bill-table">
              <tr>
                <th>Billing Month</th>
                <th>Units</th>
                <th>Rate</th>
                <th>Total</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
              ${billRows}
            </table>
          </div>
        </div>

        <div class="footer">
          <p>© 2025 Electricity Bill Payment System</p>
        </div>

      </body>
      </html>
    `);
  } catch (error) {
    console.error(error);
    res.send("Error fetching bills");
  }
});

// USER PAY BILL
app.post("/user/pay", async (req, res) => {
  const { billId, email } = req.body;

  try {
    await Bill.findByIdAndUpdate(billId, {
      status: "Paid",
    });

    res.redirect(`/user?email=${email}`);
  } catch (error) {
    console.error(error);
    res.send("Error updating payment status");
  }
});

/* LOGOUT */
app.get("/logout", (req, res) => {
  res.redirect("/login");
});

// Admin bill creation
app.post("/admin/bill", async (req, res) => {
  const { customerEmail, billingMonth, unitsConsumed, ratePerUnit } = req.body;

  try {
    const totalAmount = unitsConsumed * ratePerUnit;

    const newBill = new Bill({
      customerEmail,
      billingMonth,
      unitsConsumed,
      ratePerUnit,
      totalAmount,
    });

    await newBill.save();

    res.send(`
            <h3 style="color:green; text-align:center;">
                Bill generated successfully
            </h3>
            <div style="text-align:center;">
                <a href="/admin">Go back to Admin Dashboard</a>
            </div>
        `);
  } catch (error) {
    console.error(error);
    res.send("Error generating bill");
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
