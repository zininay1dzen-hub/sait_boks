// Работа с базой boxing_db.json (localStorage)
// Пароли хранятся открытым текстом (по ТЗ: простая проверка без шифрования)

var days = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"];
var shortDays = {
    "Понедельник": "Пн",
    "Вторник": "Вт",
    "Среда": "Ср",
    "Четверг": "Чт",
    "Пятница": "Пт",
    "Суббота": "Сб",
    "Воскресенье": "Вс"
};

// Загружает базу: сначала из localStorage, если пусто — из JSON-файла
async function getDB() {
    var text = localStorage.getItem("boxing_db_v6");
    if (text !== null) {
        return JSON.parse(text);
    }
    try {
        var response = await fetch("database/boxing_db.json");
        if (!response.ok) {
            throw new Error("Файл не найден");
        }
        var data = await response.json();
        localStorage.setItem("boxing_db_v6", JSON.stringify(data));
        return data;
    } catch (error) {
        showLoadError();
        return { users: [], groups: [], coaches: [], trainings: [], bookings: [] };
    }
}

// Сохраняет базу в localStorage
function saveDB(db) {
    localStorage.setItem("boxing_db_v6", JSON.stringify(db));
}

// Возвращает список пользователей
async function getUsers() {
    var db = await getDB();
    return db.users;
}

// fetch() не работает при открытии через file://, поэтому подсказываем, что делать
function showLoadError() {
    if (document.getElementById("loadError")) {
        return;
    }
    var box = document.createElement("div");
    box.id = "loadError";
    box.className = "load-error";
    box.textContent = "Не удалось загрузить данные из папки database. Откройте сайт через локальный сервер (например, Live Server в VS Code), а не двойным щелчком по файлу.";
    document.body.insertBefore(box, document.body.firstChild);
}

// Текущий вошедший пользователь (или null, если никто не вошёл)
async function getCurrentUser() {
    var login = localStorage.getItem("currentLogin");
    if (!login) return null;
    var users = await getUsers();
    return users.find(function (u) { return u.login === login; }) || null;
}

function setCurrentUser(user) {
    localStorage.setItem("currentLogin", user.login);
}

function logout() {
    localStorage.removeItem("currentLogin");
    window.location.href = "index.html";
}

// Поиск объекта в массиве по id
function findUserById(users, id) {
    return users.find(function (u) { return u.id === id; });
}

function findGroupById(groups, id) {
    return groups.find(function (g) { return g.id === id; });
}

function findCoachById(coaches, id) {
    return coaches.find(function (c) { return c.id === id; });
}

function findTrainingById(trainings, id) {
    return trainings.find(function (t) { return t.id === id; });
}

// Следующий свободный id для новой записи
function getNextId(list) {
    var max = 0;
    list.forEach(function (item) {
        if (item.id > max) {
            max = item.id;
        }
    });
    return max + 1;
}

// Телефон считаем правильным, если в нём не меньше 10 цифр
function isPhoneValid(phone) {
    return phone.replace(/\D/g, "").length >= 10;
}

// "Алексей Смирнов" -> "А. Смирнов"
function shortCoachName(fullName) {
    var parts = fullName.split(" ");
    return parts[0].charAt(0) + ". " + parts[1];
}

// Создаёт строку таблицы из массива текстов
function makeRow(values) {
    var tr = document.createElement("tr");
    values.forEach(function (value) {
        var td = document.createElement("td");
        td.textContent = value;
        tr.appendChild(td);
    });
    return tr;
}

// Показывает сообщение под формой: type = "error" или "success"
function showMessage(elementId, text, type) {
    var element = document.getElementById(elementId);
    element.textContent = text;
    element.className = "message " + type;
}
