    const employeeBtn = document.getElementById("employeeBtn");
    const adminBtn = document.getElementById("adminBtn");

    let selectedRole = '';

    employeeBtn.addEventListener("click", () => {
        employeeBtn.classList.add("selectedRole");
        adminBtn.classList.remove("selectedRole");
        selectedRole = 'employee'
    });

    adminBtn.addEventListener("click", () => {
        adminBtn.classList.add("selectedRole");
        employeeBtn.classList.remove("selectedRole");
        selectedRole = 'admin'
    });
