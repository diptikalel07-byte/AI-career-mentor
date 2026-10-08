const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const db = require("./database");

const app = express();
const PORT = 3000;


/* =====================================================
   MIDDLEWARE
===================================================== */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
    session({
        secret: "ai-career-mentor-secret-key",
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 24 * 60 * 60 * 1000
        }
    })
);

app.use(express.static("public"));


/* =====================================================
   VALIDATION
===================================================== */


/* NAME
   Only letters and spaces.

   Allowed:
   Jagruti
   Jagruti Walse

   Not allowed:
   Jagruti123
   123Jagruti
   Jagruti@
*/

function isValidName(name) {
    return /^[A-Za-z]+(?: [A-Za-z]+)*$/.test(name.trim());
}


/* EMAIL
   Must be Gmail.

   Allowed:
   name@gmail.com
   name123@gmail.com
   jagruti@gmail.com
   jagruti123@gmail.com

   Not allowed:
   123@gmail.com
   123jagruti@gmail.com
   @12gmail.com
   jagruti@12gmail.com
   jagruti@yahoo.com
*/

function isValidEmail(email) {
    return /^[A-Za-z][A-Za-z0-9]*@gmail\.com$/.test(
        email.trim()
    );
}


/* PASSWORD
   Minimum 8 characters
   One uppercase
   One lowercase
   One number
   One special character
*/

function isStrongPassword(password) {

    return (
        password.length >= 8 &&
        /[A-Z]/.test(password) &&
        /[a-z]/.test(password) &&
        /[0-9]/.test(password) &&
        /[^A-Za-z0-9]/.test(password)
    );

}


/* =====================================================
   REGISTER
===================================================== */

app.post("/register", (req, res) => {

    const name =
        (req.body.name || "").trim();

    const email =
        (req.body.email || "").trim().toLowerCase();

    const password =
        req.body.password || "";


    /* NAME */

    if (!name) {

        return res.status(400).json({
            success: false,
            message: "Please enter your name."
        });

    }


    if (!isValidName(name)) {

        return res.status(400).json({
            success: false,
            message: "Name can contain only letters and spaces."
        });

    }


    /* EMAIL */

    if (!email) {

        return res.status(400).json({
            success: false,
            message: "Please enter your Gmail address."
        });

    }


    if (!isValidEmail(email)) {

        return res.status(400).json({
            success: false,
            message:
                "Please enter a valid Gmail address such as name@gmail.com or name123@gmail.com."
        });

    }


    /* PASSWORD */

    if (!isStrongPassword(password)) {

        return res.status(400).json({
            success: false,
            message:
                "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character."
        });

    }


    /* CHECK EXISTING USER */

    db.get(
        "SELECT id FROM users WHERE email = ?",
        [email],
        async (err, user) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    success: false,
                    message: "Database error."
                });

            }


            if (user) {

                return res.status(409).json({
                    success: false,
                    message:
                        "An account with this Gmail address already exists."
                });

            }


            try {

                /* HASH PASSWORD */

                const hashedPassword =
                    await bcrypt.hash(password, 12);


                /* INSERT USER */

                db.run(
                    `
                    INSERT INTO users
                    (name, email, password)
                    VALUES (?, ?, ?)
                    `,
                    [
                        name,
                        email,
                        hashedPassword
                    ],
                    function (err) {

                        if (err) {

                            console.error(err);

                            return res.status(500).json({
                                success: false,
                                message:
                                    "Unable to create account."
                            });

                        }


                        return res.json({
                            success: true,
                            message:
                                "Account created successfully."
                        });

                    }
                );


            } catch (error) {

                console.error(error);

                return res.status(500).json({
                    success: false,
                    message:
                        "Unable to create account."
                });

            }

        }
    );

});


/* =====================================================
   LOGIN
===================================================== */

app.post("/login", (req, res) => {

    const email =
        (req.body.email || "").trim().toLowerCase();

    const password =
        req.body.password || "";


    if (!email || !password) {

        return res.status(400).json({
            success: false,
            message:
                "Please enter your Gmail and password."
        });

    }


    if (!isValidEmail(email)) {

        return res.status(400).json({
            success: false,
            message:
                "Please enter a valid Gmail address."
        });

    }


    db.get(
        `
        SELECT
            id,
            name,
            email,
            password
        FROM users
        WHERE email = ?
        `,
        [email],
        async (err, user) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    success: false,
                    message: "Database error."
                });

            }


            if (!user) {

                return res.status(401).json({
                    success: false,
                    message:
                        "Email or password is incorrect."
                });

            }


            try {

                const passwordMatch =
                    await bcrypt.compare(
                        password,
                        user.password
                    );


                if (!passwordMatch) {

                    return res.status(401).json({
                        success: false,
                        message:
                            "Email or password is incorrect."
                    });

                }


            req.session.user = {
    id: user.id,
    name: user.name,
    email: user.email
};

req.session.save((sessionError) => {

    if (sessionError) {

        console.error("Session save error:", sessionError);

        return res.status(500).json({
            success: false,
            message: "Unable to create login session."
        });

    }

    return res.json({
        success: true,
        message: "Login successful.",
        redirect: "/dashboard.html"
    });

});

            } catch (error) {

                console.error(error);

                return res.status(500).json({
                    success: false,
                    message:
                        "Login failed."
                });

            }

        }
    );

});


/* =====================================================
   CURRENT USER
===================================================== */

app.get("/api/user", (req, res) => {

    if (!req.session.user) {

        return res.status(401).json({
            success: false,
            message: "Not logged in."
        });

    }


    res.json({
        success: true,
        user: req.session.user
    });

});


/* =====================================================
   LOGOUT
===================================================== */

app.post("/logout", (req, res) => {

    req.session.destroy((err) => {

        if (err) {

            return res.status(500).json({
                success: false,
                message:
                    "Unable to logout."
            });

        }


        res.json({
            success: true,
            message:
                "Logged out successfully."
        });

    });

});


/* =====================================================
   PROFILE - GET
===================================================== */

app.get("/api/profile", (req, res) => {

    if (!req.session.user) {

        return res.status(401).json({
            success: false,
            message:
                "Please login first."
        });

    }


    const userId =
        req.session.user.id;


    db.get(
        `
        SELECT

            users.name,
            users.email,

            profiles.phone,
            profiles.education,
            profiles.college,
            profiles.field_of_study,
            profiles.graduation_year,
            profiles.skills,
            profiles.interests,
            profiles.career_goal,
            profiles.bio

        FROM users

        LEFT JOIN profiles
        ON users.id = profiles.user_id

        WHERE users.id = ?
        `,
        [userId],
        (err, profile) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    success: false,
                    message:
                        "Unable to load profile."
                });

            }


            res.json({
                success: true,
                profile: profile
            });

        }
    );

});


/* =====================================================
   PROFILE - SAVE
===================================================== */

app.post("/api/profile", (req, res) => {

    if (!req.session.user) {

        return res.status(401).json({
            success: false,
            message:
                "Please login first."
        });

    }


    const userId =
        req.session.user.id;


    const {
        phone,
        education,
        college,
        fieldOfStudy,
        graduationYear,
        skills,
        interests,
        careerGoal,
        bio
    } = req.body;


    db.run(
        `
        INSERT INTO profiles (

            user_id,
            phone,
            education,
            college,
            field_of_study,
            graduation_year,
            skills,
            interests,
            career_goal,
            bio,
            updated_at

        )

        VALUES (
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            CURRENT_TIMESTAMP
        )

        ON CONFLICT(user_id)

        DO UPDATE SET

            phone =
                excluded.phone,

            education =
                excluded.education,

            college =
                excluded.college,

            field_of_study =
                excluded.field_of_study,

            graduation_year =
                excluded.graduation_year,

            skills =
                excluded.skills,

            interests =
                excluded.interests,

            career_goal =
                excluded.career_goal,

            bio =
                excluded.bio,

            updated_at =
                CURRENT_TIMESTAMP
        `,
        [
            userId,
            phone || "",
            education || "",
            college || "",
            fieldOfStudy || "",
            graduationYear || "",
            skills || "",
            interests || "",
            careerGoal || "",
            bio || ""
        ],
        (err) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    success: false,
                    message:
                        "Unable to save profile."
                });

            }


            res.json({
                success: true,
                message:
                    "Profile updated successfully."
            });

        }
    );

});


/* =====================================================
   CAREERS - GET
===================================================== */

app.get("/api/careers", (req, res) => {

    if (!req.session.user) {

        return res.status(401).json({
            success: false,
            message:
                "Please login first."
        });

    }


    const search =
        (req.query.search || "").trim();

    const category =
        (req.query.category || "").trim();

    const userId =
        req.session.user.id;


    let query = `

        SELECT

            careers.*,

            CASE
                WHEN saved_careers.id IS NOT NULL
                THEN 1
                ELSE 0
            END AS saved

        FROM careers

        LEFT JOIN saved_careers

        ON careers.id =
            saved_careers.career_id

        AND saved_careers.user_id = ?

        WHERE 1 = 1

    `;


    const params = [
        userId
    ];


    if (search) {

        query += `

            AND (

                careers.title LIKE ?

                OR careers.description LIKE ?

                OR careers.skills LIKE ?

            )

        `;


        const searchValue =
            `%${search}%`;


        params.push(
            searchValue,
            searchValue,
            searchValue
        );

    }


    if (category) {

        query += `
            AND careers.category = ?
        `;

        params.push(category);

    }


    query += `
        ORDER BY careers.title ASC
    `;


    db.all(
        query,
        params,
        (err, careers) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    success: false,
                    message:
                        "Unable to load careers."
                });

            }


            res.json({
                success: true,
                careers: careers
            });

        }
    );

});


/* =====================================================
   SINGLE CAREER
===================================================== */

app.get("/api/careers/:id", (req, res) => {

    if (!req.session.user) {

        return res.status(401).json({
            success: false,
            message:
                "Please login first."
        });

    }


    const careerId =
        req.params.id;


    db.get(
        `
        SELECT *
        FROM careers
        WHERE id = ?
        `,
        [careerId],
        (err, career) => {

            if (err) {

                return res.status(500).json({
                    success: false,
                    message:
                        "Unable to load career."
                });

            }


            if (!career) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Career not found."
                });

            }


            res.json({
                success: true,
                career: career
            });

        }
    );

});


/* =====================================================
   SAVE CAREER
===================================================== */

app.post("/api/careers/:id/save", (req, res) => {

    if (!req.session.user) {

        return res.status(401).json({
            success: false,
            message:
                "Please login first."
        });

    }


    const userId =
        req.session.user.id;

    const careerId =
        req.params.id;


    db.run(
        `
        INSERT OR IGNORE INTO saved_careers
        (
            user_id,
            career_id
        )
        VALUES (?, ?)
        `,
        [
            userId,
            careerId
        ],
        (err) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    success: false,
                    message:
                        "Unable to save career."
                });

            }


            res.json({
                success: true,
                message:
                    "Career saved."
            });

        }
    );

});


/* =====================================================
   REMOVE SAVED CAREER
===================================================== */

app.delete("/api/careers/:id/save", (req, res) => {

    if (!req.session.user) {

        return res.status(401).json({
            success: false,
            message:
                "Please login first."
        });

    }


    const userId =
        req.session.user.id;

    const careerId =
        req.params.id;


    db.run(
        `
        DELETE FROM saved_careers

        WHERE user_id = ?

        AND career_id = ?
        `,
        [
            userId,
            careerId
        ],
        (err) => {

            if (err) {

                return res.status(500).json({
                    success: false,
                    message:
                        "Unable to remove saved career."
                });

            }


            res.json({
                success: true,
                message:
                    "Career removed."
            });

        }
    );

});


/* =====================================================
   SAVED CAREERS
===================================================== */

app.get("/api/saved-careers", (req, res) => {

    if (!req.session.user) {

        return res.status(401).json({
            success: false,
            message:
                "Please login first."
        });

    }


    const userId =
        req.session.user.id;


    db.all(
        `
        SELECT careers.*

        FROM careers

        INNER JOIN saved_careers

        ON careers.id =
            saved_careers.career_id

        WHERE saved_careers.user_id = ?

        ORDER BY
            saved_careers.saved_at DESC
        `,
        [userId],
        (err, careers) => {

            if (err) {

                return res.status(500).json({
                    success: false,
                    message:
                        "Unable to load saved careers."
                });

            }


            res.json({
                success: true,
                careers: careers
            });

        }
    );

});


/* =====================================================
   START SERVER
===================================================== */

app.listen(PORT, () => {

    console.log("");
    console.log("----------------------------------");
    console.log("AI Career Mentor is running");
    console.log(`http://localhost:${PORT}`);
    console.log("----------------------------------");
    console.log("");

});
