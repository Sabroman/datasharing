const USERS_KEY = "msproject_users";
const SESSION_KEY = "msproject_session";
const ENROLLMENTS_KEY = "msproject_enrollments";

const defaultCourses = [
  {
    id: "grundforloeb",
    title: "MS Project Grundforløb",
    date: "02-04-2026",
    level: "Begynder"
  },
  {
    id: "ressourcestyring",
    title: "Ressourcestyring i praksis",
    date: "16-04-2026",
    level: "Øvet"
  },
  {
    id: "rapportering",
    title: "Status og rapportering",
    date: "30-04-2026",
    level: "Alle niveauer"
  }
];

const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const authCard = document.getElementById("auth-card");
const portalCard = document.getElementById("portal-card");
const authMessage = document.getElementById("auth-message");
const userName = document.getElementById("user-name");
const coursesContainer = document.getElementById("courses");
const enrollmentsList = document.getElementById("enrollments");
const logoutBtn = document.getElementById("logout-btn");

function readJson(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function setMessage(text, type = "") {
  authMessage.className = type;
  authMessage.textContent = text;
}

function getUsers() {
  return readJson(USERS_KEY, []);
}

function saveSession(user) {
  saveJson(SESSION_KEY, user);
}

function getSession() {
  return readJson(SESSION_KEY, null);
}

function getEnrollments() {
  return readJson(ENROLLMENTS_KEY, {});
}

function setEnrollments(data) {
  saveJson(ENROLLMENTS_KEY, data);
}

function showPortal(user) {
  authCard.classList.add("hidden");
  portalCard.classList.remove("hidden");
  userName.textContent = user.name;
  renderCourses(user.email);
  renderEnrollments(user.email);
}

function showAuth() {
  portalCard.classList.add("hidden");
  authCard.classList.remove("hidden");
}

function renderCourses(email) {
  coursesContainer.innerHTML = "";
  const enrollments = getEnrollments();
  const userEnrollments = enrollments[email] || [];

  defaultCourses.forEach((course) => {
    const enrolled = userEnrollments.includes(course.id);
    const card = document.createElement("div");
    card.className = "course";
    card.innerHTML = `
      <h4>${course.title}</h4>
      <p>Dato: ${course.date} · Niveau: ${course.level}</p>
      <button data-course-id="${course.id}" ${enrolled ? "disabled" : ""}>
        ${enrolled ? "Tilmeldt" : "Tilmeld kursus"}
      </button>
    `;

    card.querySelector("button").addEventListener("click", () => {
      enrollUserInCourse(email, course.id);
    });

    coursesContainer.appendChild(card);
  });
}

function renderEnrollments(email) {
  const enrollments = getEnrollments();
  const userEnrollments = enrollments[email] || [];

  enrollmentsList.innerHTML = "";

  if (!userEnrollments.length) {
    const li = document.createElement("li");
    li.textContent = "Ingen aktive tilmeldinger endnu.";
    enrollmentsList.appendChild(li);
    return;
  }

  userEnrollments.forEach((courseId) => {
    const course = defaultCourses.find((item) => item.id === courseId);
    if (!course) {
      return;
    }

    const li = document.createElement("li");
    li.textContent = `${course.title} (${course.date})`;
    enrollmentsList.appendChild(li);
  });
}

function enrollUserInCourse(email, courseId) {
  const enrollments = getEnrollments();
  const userEnrollments = enrollments[email] || [];

  if (!userEnrollments.includes(courseId)) {
    userEnrollments.push(courseId);
  }

  enrollments[email] = userEnrollments;
  setEnrollments(enrollments);
  renderCourses(email);
  renderEnrollments(email);
}

registerForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = document.getElementById("register-name").value.trim();
  const email = document.getElementById("register-email").value.trim().toLowerCase();
  const password = document.getElementById("register-password").value;

  const users = getUsers();

  if (users.some((user) => user.email === email)) {
    setMessage("Denne e-mail er allerede registreret.", "error");
    return;
  }

  users.push({ name, email, password });
  saveJson(USERS_KEY, users);

  setMessage("Bruger oprettet. Du kan nu logge ind.", "success");
  registerForm.reset();
});

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const email = document.getElementById("login-email").value.trim().toLowerCase();
  const password = document.getElementById("login-password").value;

  const users = getUsers();
  const user = users.find((candidate) => candidate.email === email && candidate.password === password);

  if (!user) {
    setMessage("Forkert e-mail eller adgangskode.", "error");
    return;
  }

  saveSession({ name: user.name, email: user.email });
  setMessage("");
  loginForm.reset();
  showPortal(user);
});

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem(SESSION_KEY);
  setMessage("Du er logget ud.", "success");
  showAuth();
});

(function init() {
  const session = getSession();
  if (session?.email) {
    showPortal(session);
    return;
  }
  showAuth();
})();
