const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./users.db", (err) => {
    if (err) {
        console.error("Database connection failed:", err.message);
    } else {
        console.log("Connected to SQLite database.");
    }
});

db.serialize(() => {

    // =========================
    // USERS
    // =========================

    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);


    // =========================
    // USER PROFILES
    // =========================

    db.run(`
        CREATE TABLE IF NOT EXISTS profiles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL UNIQUE,
            phone TEXT,
            education TEXT,
            college TEXT,
            field_of_study TEXT,
            graduation_year TEXT,
            skills TEXT,
            interests TEXT,
            career_goal TEXT,
            bio TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `);


    // =========================
    // CAREERS
    // =========================

    db.run(`
        CREATE TABLE IF NOT EXISTS careers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL UNIQUE,
            category TEXT NOT NULL,
            description TEXT NOT NULL,
            education TEXT,
            skills TEXT,
            growth TEXT,
            work_style TEXT
        )
    `);


    // =========================
    // SAVED CAREERS
    // =========================

    db.run(`
        CREATE TABLE IF NOT EXISTS saved_careers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            career_id INTEGER NOT NULL,
            saved_at DATETIME DEFAULT CURRENT_TIMESTAMP,

            UNIQUE(user_id, career_id),

            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (career_id) REFERENCES careers(id)
        )
    `);


    // =========================
    // CAREER DATA
    // =========================

    const careers = [

        [
            "Software Developer",
            "Technology",
            "Design, develop, test and maintain software applications for businesses and users.",
            "BCA, BSc CS, BTech CS or related degree",
            "JavaScript, Python, Java, SQL, Git",
            "Excellent",
            "Office / Remote"
        ],

        [
            "Web Developer",
            "Technology",
            "Build and maintain websites and web applications using modern frontend and backend technologies.",
            "BCA, BSc CS, BTech or relevant certification",
            "HTML, CSS, JavaScript, React, Node.js",
            "Excellent",
            "Office / Remote"
        ],

        [
            "Data Analyst",
            "Data",
            "Analyze business data and create reports and dashboards that help organizations make better decisions.",
            "BCA, BSc, BCom, BBA, Statistics or related field",
            "Excel, SQL, Python, Power BI, Statistics",
            "Very Strong",
            "Office / Hybrid"
        ],

        [
            "Data Scientist",
            "Data",
            "Use statistics, programming and machine learning to discover patterns and insights from data.",
            "BSc, BCA, BTech, MSc or related degree",
            "Python, SQL, Statistics, Machine Learning",
            "Excellent",
            "Office / Remote"
        ],

        [
            "AI / ML Engineer",
            "Artificial Intelligence",
            "Develop artificial intelligence and machine learning systems that solve real-world problems.",
            "BTech, BCA, BSc, MSc or related technical degree",
            "Python, Machine Learning, Deep Learning, SQL",
            "Excellent",
            "Office / Remote"
        ],

        [
            "Cybersecurity Analyst",
            "Cybersecurity",
            "Protect computer systems, networks and data from security threats and unauthorized access.",
            "BCA, BSc CS, BTech or cybersecurity certification",
            "Networking, Linux, Security, Python, SIEM",
            "Excellent",
            "Office / Hybrid"
        ],

        [
            "UI/UX Designer",
            "Design",
            "Design user-friendly digital products and improve the overall experience of applications and websites.",
            "Any degree with UI/UX skills or design qualification",
            "Figma, UI Design, UX Research, Prototyping",
            "Strong",
            "Office / Remote"
        ],

        [
            "Cloud Engineer",
            "Cloud",
            "Design, deploy and maintain cloud infrastructure and services.",
            "BCA, BTech, BSc CS or related degree",
            "AWS, Azure, Linux, Networking, Docker",
            "Excellent",
            "Office / Remote"
        ],

        [
            "Business Analyst",
            "Business",
            "Study business requirements and help organizations improve processes and make better decisions.",
            "BBA, BCA, BCom, MBA or related degree",
            "Excel, SQL, Communication, Power BI, Analysis",
            "Strong",
            "Office / Hybrid"
        ],

        [
            "Digital Marketing Specialist",
            "Marketing",
            "Plan and manage digital marketing campaigns across search engines, social media and online platforms.",
            "Any degree with digital marketing skills",
            "SEO, Social Media, Analytics, Content Marketing",
            "Strong",
            "Office / Remote"
        ]

    ];


    const insertCareer = db.prepare(`
        INSERT OR IGNORE INTO careers
        (
            title,
            category,
            description,
            education,
            skills,
            growth,
            work_style
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);


    careers.forEach((career) => {
        insertCareer.run(career);
    });


    insertCareer.finalize();

});


module.exports = db;