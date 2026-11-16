// "1 тренировка", "2 тренировки", "5 тренировок"
function trainingsWord(count) {
    var lastDigit = count % 10;
    var lastTwoDigits = count % 100;
    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
        return count + " тренировок";
    }
    if (lastDigit === 1) {
        return count + " тренировка";
    }
    if (lastDigit >= 2 && lastDigit <= 4) {
        return count + " тренировки";
    }
    return count + " тренировок";
}

async function showCabinet() {
    var user = await getCurrentUser();
    if (!user || user.login === "admin") {
        window.location.href = "auth.html";
        return;
    }

    var db = await getDB();
    var bookings = db.bookings.filter(function (b) { return b.user_id === user.id; });
    var trainings = db.trainings;
    var groups = db.groups;
    var coaches = db.coaches;
    var groupNames = [];

    var view = bookings.map(function (b) {
        var t = findTrainingById(trainings, b.training_id);
        var group = t ? findGroupById(groups, t.group_id) : null;
        var coach = group ? findCoachById(coaches, group.coach_id) : null;
        if (group && groupNames.indexOf(group.name) === -1) {
            groupNames.push(group.name);
        }
        return {
            day: t ? t.day_of_week : "—",
            time: t ? t.time : "—",
            coach: coach ? coach.name : "—"
        };
    });

    var groupName = groupNames.length > 0 ? groupNames.join(", ") : "не выбрана";
    document.getElementById("headerUser").textContent = user.name;
    document.getElementById("userName").textContent = user.name;
    document.getElementById("userGroup").textContent = "Группа: " + groupName;
    document.getElementById("bookingCount").textContent = trainingsWord(view.length);

    var tableBody = document.getElementById("myBookings");
    tableBody.innerHTML = "";
    if (view.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="3" class="empty-cell">У вас пока нет записей. Записаться можно на <a href="index.html#signup">главной странице</a>.</td></tr>';
        return;
    }
    view.forEach(function (v) {
        tableBody.appendChild(makeRow([v.day, v.time, v.coach]));
    });
}

async function start() {
    var user = await getCurrentUser();
    if (!user || user.login === "admin") {
        window.location.href = "auth.html";
        return;
    }
    showCabinet();
}

document.getElementById("logoutButton").addEventListener("click", logout);
start();
