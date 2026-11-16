var forms = {
    client: document.getElementById("clientForm"),
    register: document.getElementById("registerForm"),
    admin: document.getElementById("adminForm")
};
var tabs = {
    client: document.getElementById("tabClient"),
    register: document.getElementById("tabRegister"),
    admin: document.getElementById("tabAdmin")
};

var tabTexts = {
    client: {
        title: "С ВОЗВРАЩЕНИЕМ",
        text: "Войдите, чтобы управлять своими тренировками.",
        hint: 'Нет аккаунта? <a href="index.html#signup">Запишитесь на первую тренировку.</a>'
    },
    register: {
        title: "СОЗДАТЬ АККАУНТ",
        text: "Зарегистрируйтесь, чтобы управлять своими тренировками.",
        hint: 'Уже есть аккаунт? <a id="backToLogin">Вход для клиента</a>'
    },
    admin: {
        title: "ВХОД ДЛЯ АДМИНИСТРАТОРА",
        text: "Войдите, чтобы управлять расписанием и записями клуба.",
        hint: 'Нет аккаунта? <a href="index.html#signup">Запишитесь на первую тренировку.</a>'
    }
};

function showTab(name) {
    for (var key in forms) {
        if (key === name) {
            forms[key].style.display = "block";
            tabs[key].classList.add("active");
        } else {
            forms[key].style.display = "none";
            tabs[key].classList.remove("active");
        }
    }

    var title = document.getElementById("cardTitle");
    title.textContent = tabTexts[name].title;
    if (name === "admin") {
        title.classList.add("small-title");
    } else {
        title.classList.remove("small-title");
    }
    document.getElementById("cardText").textContent = tabTexts[name].text;
    document.getElementById("loginHint").innerHTML = tabTexts[name].hint;

    var backLink = document.getElementById("backToLogin");
    if (backLink) {
        backLink.addEventListener("click", function () {
            showTab("client");
        });
    }
}

// Простая проверка логина и пароля без шифрования (по ТЗ)
async function findUser(login, password) {
    var users = await getUsers();
    return users.find(function (user) {
        return user.login.toLowerCase() === login.toLowerCase() &&
               user.password === password;
    });
}

async function loginClient(event) {
    event.preventDefault();
    var login = document.getElementById("clientLogin").value.trim();
    var password = document.getElementById("clientPassword").value;

    if (login === "" || password === "") {
        showMessage("clientMessage", "Введите логин и пароль.", "error");
        return;
    }
    var user = await findUser(login, password);
    if (!user || user.login === "admin") {
        showMessage("clientMessage", "Неверный логин или пароль.", "error");
        return;
    }
    setCurrentUser(user);
    window.location.href = "profile.html";
}

async function loginAdmin(event) {
    event.preventDefault();
    var login = document.getElementById("adminLogin").value.trim();
    var password = document.getElementById("adminPassword").value;

    if (login === "" || password === "") {
        showMessage("adminMessage", "Введите логин и пароль.", "error");
        return;
    }
    var user = await findUser(login, password);
    if (!user || user.login !== "admin") {
        showMessage("adminMessage", "Неверный логин или пароль администратора.", "error");
        return;
    }
    setCurrentUser(user);
    window.location.href = "admin.html";
}

async function registerClient(event) {
    event.preventDefault();
    var name = document.getElementById("regName").value.trim();
    var phone = document.getElementById("regPhone").value.trim();
    var login = document.getElementById("regLogin").value.trim();
    var password = document.getElementById("regPassword").value;

    if (name.length < 2) {
        showMessage("registerMessage", "Введите имя (не короче 2 символов).", "error");
        return;
    }
    if (!isPhoneValid(phone)) {
        showMessage("registerMessage", "Введите телефон полностью, например +7 (999) 123-45-67.", "error");
        return;
    }
    if (login.length < 3) {
        showMessage("registerMessage", "Логин должен быть не короче 3 символов.", "error");
        return;
    }
    if (password.length < 4) {
        showMessage("registerMessage", "Пароль должен быть не короче 4 символов.", "error");
        return;
    }

    var users = await getUsers();
    var loginTaken = users.find(function (user) {
        return user.login.toLowerCase() === login.toLowerCase();
    });
    if (loginTaken) {
        showMessage("registerMessage", "Такой логин уже занят. Выберите другой.", "error");
        return;
    }

    users.push({
        id: getNextId(users),
        login: login,
        password: password,
        name: name,
        phone: phone
    });
    var db = await getDB();
    db.users = users;
    saveDB(db);

    document.getElementById("registerForm").reset();
    document.getElementById("registerMessage").textContent = "";
    showTab("client");
    document.getElementById("clientLogin").value = login;
    showMessage("clientMessage", "Аккаунт создан! Теперь войдите под своим логином.", "success");
}

tabs.client.addEventListener("click", function () { showTab("client"); });
tabs.register.addEventListener("click", function () { showTab("register"); });
tabs.admin.addEventListener("click", function () { showTab("admin"); });

forms.client.addEventListener("submit", loginClient);
forms.register.addEventListener("submit", registerClient);
forms.admin.addEventListener("submit", loginAdmin);

showTab("client");
