// =====================================================
// AI CAREER MENTOR - COMMON SCRIPT
// =====================================================

// Check logged-in user without redirecting automatically
async function getLoggedInUser() {
    try {
        const response = await fetch("/api/user", {
            method: "GET",
            credentials: "include"
        });

        if (!response.ok) {
            return null;
        }

        const data = await response.json();

        if (data.success && data.user) {
            return data.user;
        }

        return null;
    } catch (error) {
        console.error("Unable to check login:", error);
        return null;
    }
}


// =====================================================
// DISPLAY USER INFORMATION
// =====================================================

async function displayUserInfo() {
    const user = await getLoggedInUser();

    if (!user) {
        return;
    }

    const nameElements = document.querySelectorAll(
        "#userName, .user-name, [data-user-name]"
    );

    nameElements.forEach(element => {
        element.textContent = user.name;
    });

    const emailElements = document.querySelectorAll(
        "#userEmail, .user-email, [data-user-email]"
    );

    emailElements.forEach(element => {
        element.textContent = user.email;
    });
}


// =====================================================
// LOGOUT
// =====================================================

async function logoutUser() {
    try {
        const response = await fetch("/logout", {
            method: "POST",
            credentials: "include"
        });

        const data = await response.json();

        if (data.success) {
            window.location.replace("/login.html");
        } else {
            alert("Unable to logout. Please try again.");
        }

    } catch (error) {
        console.error("Logout error:", error);
        alert("Something went wrong while logging out.");
    }
}


// =====================================================
// LOGOUT BUTTONS
// =====================================================

document.addEventListener("DOMContentLoaded", function () {

    displayUserInfo();

    const logoutButtons = document.querySelectorAll(
        "#logoutBtn, .logout-btn, [data-logout]"
    );

    logoutButtons.forEach(button => {
        button.addEventListener("click", function (event) {
            event.preventDefault();
            logoutUser();
        });
    });

});