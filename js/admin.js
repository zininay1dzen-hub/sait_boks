var addDay = document.getElementById("addDay");
var addTime = document.getElementById("addTime");
var addGroup = document.getElementById("addGroup");
var addCoach = document.getElementById("addCoach");
var bookingSearch = document.getElementById("bookingSearch");
var adminGroups = [];

// Заполняет выпадающий список вариантами
function fillSelect(select, placeholder, items) {
    select.innerHTML = '<option value="">' + placeholder + "</option>";
    items.forEach(function (item) {
        var option = document.createElement("option");
        option.value = item.id;
        option.textContent = item.name;
        select.appendChild(option);
    });
}

// Тренер закреплён за группой, поэтому подставляем его автоматически
function syncCoach() {
    var group = findGroupById(adminGroups, Number(addGroup.value));
    addCoach.value = group ? group.coach_id : "";
}

function makeDeleteCell(onClick) {
    var td = document.createElement("td");
    td.className = "action-cell";
    var button = document.createElement("button");
    button.type = "button";
    button.className = "delete-button";
    button.textContent = "Удалить";
    button.addEventListener("click", onClick);
    td.appendChild(button);
    return td;
}

async function showTrainings() {
    var tableBody = document.getElementById("trainingsBody");
    tableBody.innerHTML = "";
    var db = await getDB();
    var trainings = db.trainings;
    var groups = db.groups;
    var coaches = db.coaches;

    if (trainings.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="empty-cell">Тренировок пока нет</td></tr>';
        return;
    }
    trainings.forEach(function (t) {
        var group = findGroupById(groups, t.group_id);
        var coach = group ? findCoachById(coaches, group.coach_id) : null;

        var row = makeRow([
            t.day_of_week,
            t.time,
            group ? group.name : "—",
            coach ? coach.name : "—"
        ]);
        row.appendChild(makeDeleteCell(function () {
            deleteTraining(t.id);
        }));
        tableBody.appendChild(row);
    });
}

async function showBookings() {
    var tableBody = document.getElementById("bookingsBody");
    var text = bookingSearch.value.trim().toLowerCase();
    var db = await getDB();
    var bookings = db.bookings;
    var users = db.users;
    var trainings = db.trainings;
    var groups = db.groups;
    var coaches = db.coaches;

    var view = bookings.map(function (b) {
        var user = findUserById(users, b.user_id);
        var t = findTrainingById(trainings, b.training_id);
        var group = t ? findGroupById(groups, t.group_id) : null;
        var coach = group ? findCoachById(coaches, group.coach_id) : null;
        var trainingText = "—";
        if (t) {
            var startTime = t.time.split(" – ")[0];
            trainingText = shortDays[t.day_of_week] + ", " + startTime;
            if (coach) {
                trainingText += " · " + shortCoachName(coach.name);
            }
        }
        return {
            name: user ? user.name : "—",
            phone: user ? user.phone : "—",
            group: group ? group.name : "—",
            training: trainingText,
            id: b.id
        };
    }).filter(function (item) {
        if (!text) return true;
        return item.name.toLowerCase().includes(text) ||
               item.group.toLowerCase().includes(text);
    });

    tableBody.innerHTML = "";
    if (view.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="empty-cell">Записей не найдено</td></tr>';
        return;
    }
    view.forEach(function (item) {
        var row = makeRow([item.name, item.phone, item.group, item.training]);
        row.appendChild(makeDeleteCell(function () {
            deleteBooking(item.id);
        }));
        tableBody.appendChild(row);
    });
}

async function addTraining(event) {
    event.preventDefault();
    var db = await getDB();

    var day = addDay.value;
    var time = addTime.value.trim();
    var groupId = Number(addGroup.value);

    if (day === "" || time === "" || !groupId) {
        showMessage("addMessage", "Заполните день, время и группу.", "error");
        return;
    }
    if (!/^\d{2}:\d{2}\s*[-–—]\s*\d{2}:\d{2}$/.test(time)) {
        showMessage("addMessage", "Время нужно указать в формате 19:00 – 20:30.", "error");
        return;
    }

    var group = findGroupById(db.groups, groupId);
    if (!group) {
        showMessage("addMessage", "Группа не найдена.", "error");
        return;
    }

    var parts = time.split(/\s*[-–—]\s*/);
    db.trainings.push({
        id: getNextId(db.trainings),
        day_of_week: day,
        time: parts[0] + " – " + parts[1],
        group_id: groupId
    });
    saveDB(db);

    document.getElementById("addForm").reset();
    syncCoach();
    showMessage("addMessage", "Тренировка добавлена в расписание.", "success");
    showTrainings();
}

async function deleteTraining(id) {
    if (!confirm("Удалить тренировку? Записи клиентов на неё тоже будут удалены.")) {
        return;
    }
    var db = await getDB();
    db.trainings = db.trainings.filter(function (t) { return t.id !== id; });
    db.bookings = db.bookings.filter(function (b) { return b.training_id !== id; });
    saveDB(db);
    showTrainings();
    showBookings();
}

async function deleteBooking(id) {
    if (!confirm("Удалить запись клиента?")) {
        return;
    }
    var db = await getDB();
    db.bookings = db.bookings.filter(function (b) { return b.id !== id; });
    saveDB(db);
    showBookings();
}

async function start() {
    var admin = await getCurrentUser();
    if (!admin || admin.login !== "admin") {
        window.location.href = "auth.html";
        return;
    }

    var db = await getDB();
    adminGroups = db.groups;
    fillSelect(addDay, "Выберите день", days.map(function (d) { return { id: d, name: d }; }));
    fillSelect(addGroup, "Выберите группу", db.groups);
    fillSelect(addCoach, "Выберите тренера", db.coaches);
    syncCoach();
    showTrainings();
    showBookings();
}

document.getElementById("addForm").addEventListener("submit", addTraining);
document.getElementById("logoutButton").addEventListener("click", logout);
bookingSearch.addEventListener("input", showBookings);
addGroup.addEventListener("change", syncCoach);

start();
