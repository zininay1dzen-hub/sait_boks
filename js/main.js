var scheduleBody = document.getElementById("scheduleBody");
var scheduleSearch = document.getElementById("scheduleSearch");
var signupForm = document.getElementById("signupForm");
var signupName = document.getElementById("signupName");
var signupPhone = document.getElementById("signupPhone");
var signupGroup = document.getElementById("signupGroup");
var currentUser;

// Карточки тренеров (из coaches в boxing_db.json)
async function showTrainers() {
    var db = await getDB();
    var coaches = db.coaches;
    var groups = db.groups;
    var list = document.getElementById("trainersList");
    list.innerHTML = "";

    coaches.forEach(function (coach, index) {
        var card = document.createElement("div");
        card.className = "trainer-card";
        var groupNames = groups
            .filter(function (g) { return g.coach_id === coach.id; })
            .map(function (g) { return g.name; })
            .join(", ");
        var subtitle = coach.specialty + (groupNames ? " · " + groupNames : "");
        card.innerHTML =
            '<img src="images/trainer' + (index + 1) + '.jpg" alt="' + coach.name + '">' +
            '<div class="trainer-info">' +
            '<div class="trainer-number">0' + (index + 1) + ' / ТРЕНЕР</div>' +
            '<h3>' + coach.name + '</h3>' +
            '<p>' + subtitle + '</p>' +
            '</div>';
        list.appendChild(card);
    });
}

// Расписание с поиском по дню или тренеру
async function showSchedule() {
    var text = scheduleSearch.value.trim().toLowerCase();
    var db = await getDB();
    var trainings = db.trainings;
    var groups = db.groups;
    var coaches = db.coaches;

    var view = trainings.map(function (t) {
        var group = findGroupById(groups, t.group_id);
        var coach = findCoachById(coaches, group ? group.coach_id : null);
        return {
            id: t.id,
            day: t.day_of_week,
            time: t.time,
            group: group ? group.name : "—",
            coach: coach ? coach.name : "—"
        };
    }).filter(function (t) {
        return t.day.toLowerCase().includes(text) ||
               t.coach.toLowerCase().includes(text) ||
               t.group.toLowerCase().includes(text);
    });

    scheduleBody.innerHTML = "";
    if (view.length === 0) {
        scheduleBody.innerHTML = '<tr><td colspan="4" class="empty-cell">Ничего не найдено</td></tr>';
        return;
    }
    view.forEach(function (t) {
        scheduleBody.appendChild(makeRow([t.day, t.time, t.group, t.coach]));
    });
}

// Выпадающий список групп для формы записи (каждая тренировка из расписания)
async function fillGroupSelect() {
    var db = await getDB();
    var trainings = db.trainings;
    var groups = db.groups;
    var coaches = db.coaches;

    signupGroup.innerHTML = '<option value="">Выберите тренировку из расписания</option>';
    trainings.forEach(function (t) {
        var group = findGroupById(groups, t.group_id);
        var coach = group ? findCoachById(coaches, group.coach_id) : null;
        var option = document.createElement("option");
        option.value = t.id;
        option.textContent = t.day_of_week + " " + t.time + " · " + (group ? group.name : "—") + " · " + (coach ? coach.name : "—");
        signupGroup.appendChild(option);
    });
}

async function sendRequest(event) {
    event.preventDefault();

    if (!currentUser) {
        window.location.href = "auth.html";
        return;
    }
    if (currentUser.login === "admin") {
        showMessage("signupMessage", "Администратор не может записываться на тренировки.", "error");
        return;
    }

    var name = signupName.value.trim();
    var phone = signupPhone.value.trim();
    var trainingId = Number(signupGroup.value);

    if (name.length < 2) {
        showMessage("signupMessage", "Введите имя (не короче 2 символов).", "error");
        return;
    }
    if (!isPhoneValid(phone)) {
        showMessage("signupMessage", "Введите телефон полностью, например +7 (999) 123-45-67.", "error");
        return;
    }
    if (trainingId === 0) {
        showMessage("signupMessage", "Выберите тренировку из расписания.", "error");
        return;
    }

    var db = await getDB();
    var bookings = db.bookings;
    var alreadyBooked = bookings.find(function (booking) {
        return booking.user_id === currentUser.id && booking.training_id === trainingId;
    });
    if (alreadyBooked) {
        showMessage("signupMessage", "Вы уже записаны на эту тренировку.", "error");
        return;
    }

    bookings.push({
        id: getNextId(bookings),
        training_id: trainingId,
        user_id: currentUser.id
    });
    db.bookings = bookings;
    saveDB(db);
    window.location.href = "profile.html";
}

// Если пользователь вошёл, меняем ссылку «Войти» и подставляем его данные в форму
function setupForLoggedUser() {
    if (!currentUser) {
        return;
    }
    var loginLink = document.getElementById("loginLink");
    loginLink.textContent = "Кабинет";
    if (currentUser.login === "admin") {
        loginLink.href = "admin.html";
    } else {
        loginLink.href = "profile.html";
        signupName.value = currentUser.name;
        signupPhone.value = currentUser.phone;
        signupName.readOnly = true;
        signupPhone.readOnly = true;
    }
}

async function start() {
    currentUser = await getCurrentUser();
    setupForLoggedUser();
    showTrainers();
    showSchedule();
    fillGroupSelect();
}

scheduleSearch.addEventListener("input", showSchedule);
signupForm.addEventListener("submit", sendRequest);

start();
