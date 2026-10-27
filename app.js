(() => {
  const STORAGE_KEY = "ejercicios-habitos.routines";
  const WEEK_KEY = "ejercicios-habitos.week";
  const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

  const form = document.getElementById("routine-form");
  const formTitle = document.getElementById("form-title");
  const nameInput = document.getElementById("routine-name");
  const descInput = document.getElementById("routine-description");
  const exerciseNameInput = document.getElementById("exercise-name");
  const setsInput = document.getElementById("exercise-sets");
  const repsInput = document.getElementById("exercise-reps");
  const addExerciseBtn = document.getElementById("add-exercise");
  const exerciseList = document.getElementById("exercise-list");
  const cancelBtn = document.getElementById("cancel-edit");
  const errorEl = document.getElementById("form-error");
  const routineList = document.getElementById("routine-list");
  const emptyState = document.getElementById("empty-state");
  const weekPlanList = document.getElementById("week-plan");

  let routines = loadRoutines();
  let week = loadWeek();
  let draftExercises = [];
  let editingId = null;

  function loadRoutines() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  function loadWeek() {
    try {
      const data = JSON.parse(localStorage.getItem(WEEK_KEY));
      return data && typeof data === "object" ? data : {};
    } catch {
      return {};
    }
  }

  function saveRoutines() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(routines));
    } catch {
      showError("No se pudo guardar en este navegador.");
    }
  }

  function saveWeek() {
    try {
      localStorage.setItem(WEEK_KEY, JSON.stringify(week));
    } catch {
      showError("No se pudo guardar el plan semanal.");
    }
  }

  function showError(message) {
    errorEl.textContent = message;
    errorEl.classList.remove("hidden");
  }

  function clearError() {
    errorEl.textContent = "";
    errorEl.classList.add("hidden");
  }

  function newId() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  }

  function renderDraft() {
    exerciseList.innerHTML = "";
    draftExercises.forEach((ex, index) => {
      const li = document.createElement("li");
      const label = document.createElement("span");
      label.textContent = `${ex.name} · ${ex.sets} × ${ex.reps}`;

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "btn danger icon";
      remove.textContent = "✕";
      remove.setAttribute("aria-label", `Quitar ${ex.name}`);
      remove.addEventListener("click", () => {
        draftExercises.splice(index, 1);
        renderDraft();
      });

      li.append(label, remove);
      exerciseList.appendChild(li);
    });
  }

  function addExercise() {
    const name = exerciseNameInput.value.trim();
    const sets = Number(setsInput.value);
    const reps = Number(repsInput.value);

    if (!name) {
      showError("Escribe el nombre del ejercicio.");
      exerciseNameInput.focus();
      return;
    }
    if (!Number.isInteger(sets) || sets < 1 || !Number.isInteger(reps) || reps < 1) {
      showError("Series y repeticiones deben ser números enteros mayores que 0.");
      return;
    }

    clearError();
    draftExercises.push({ name, sets, reps });
    exerciseNameInput.value = "";
    exerciseNameInput.focus();
    renderDraft();
  }

  function resetForm() {
    form.reset();
    setsInput.value = 3;
    repsInput.value = 10;
    draftExercises = [];
    editingId = null;
    formTitle.textContent = "Nueva rutina";
    cancelBtn.classList.add("hidden");
    clearError();
    renderDraft();
  }

  function startEdit(id) {
    const routine = routines.find((r) => r.id === id);
    if (!routine) return;

    editingId = id;
    nameInput.value = routine.name;
    descInput.value = routine.description;
    draftExercises = routine.exercises.map((ex) => ({ ...ex }));
    formTitle.textContent = "Editar rutina";
    cancelBtn.classList.remove("hidden");
    clearError();
    renderDraft();
    nameInput.focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function deleteRoutine(id) {
    const routine = routines.find((r) => r.id === id);
    if (!routine) return;
    if (!confirm(`¿Eliminar la rutina "${routine.name}"?`)) return;

    routines = routines.filter((r) => r.id !== id);
    DAYS.forEach((_, index) => {
      if (week[index] === id) delete week[index];
    });
    saveRoutines();
    saveWeek();
    if (editingId === id) resetForm();
    renderRoutines();
  }

  function handleSubmit(event) {
    event.preventDefault();
    const name = nameInput.value.trim();
    if (!name) {
      showError("Escribe un nombre para la rutina.");
      nameInput.focus();
      return;
    }
    if (draftExercises.length === 0) {
      showError("Agrega al menos un ejercicio.");
      return;
    }

    const data = {
      name,
      description: descInput.value.trim(),
      exercises: draftExercises.map((ex) => ({ ...ex })),
    };

    if (editingId) {
      routines = routines.map((r) => (r.id === editingId ? { ...r, ...data } : r));
    } else {
      routines.push({ id: newId(), createdAt: new Date().toISOString(), ...data });
    }

    saveRoutines();
    resetForm();
    renderRoutines();
  }

  function renderRoutines() {
    routineList.innerHTML = "";
    emptyState.classList.toggle("hidden", routines.length > 0);

    routines.forEach((routine) => {
      const li = document.createElement("li");

      const row = document.createElement("div");
      row.className = "routine-row";

      const info = document.createElement("div");
      const title = document.createElement("strong");
      title.textContent = routine.name;
      info.appendChild(title);

      const meta = document.createElement("p");
      meta.className = "routine-meta";
      const count = routine.exercises.length;
      meta.textContent = `${count} ${count === 1 ? "ejercicio" : "ejercicios"}${routine.description ? " · " + routine.description : ""}`;
      info.appendChild(meta);

      const actions = document.createElement("div");
      actions.className = "actions";

      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "btn secondary";
      editBtn.textContent = "Editar";
      editBtn.addEventListener("click", () => startEdit(routine.id));

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "btn danger";
      deleteBtn.textContent = "Eliminar";
      deleteBtn.addEventListener("click", () => deleteRoutine(routine.id));

      actions.append(editBtn, deleteBtn);
      row.append(info, actions);

      const list = document.createElement("ol");
      list.className = "routine-exercises";
      routine.exercises.forEach((ex) => {
        const item = document.createElement("li");
        item.textContent = `${ex.name} · ${ex.sets} × ${ex.reps}`;
        list.appendChild(item);
      });

      li.append(row, list);
      routineList.appendChild(li);
    });

    renderWeek();
  }

  function renderWeek() {
    weekPlanList.innerHTML = "";

    DAYS.forEach((day, index) => {
      const li = document.createElement("li");

      const label = document.createElement("span");
      label.className = "day-label";
      label.textContent = day;

      const select = document.createElement("select");
      select.setAttribute("aria-label", `Rutina del ${day}`);

      const rest = document.createElement("option");
      rest.value = "";
      rest.textContent = "Descanso";
      select.appendChild(rest);

      routines.forEach((routine) => {
        const option = document.createElement("option");
        option.value = routine.id;
        option.textContent = routine.name;
        select.appendChild(option);
      });

      select.value = week[index] || "";
      select.addEventListener("change", () => {
        if (select.value) {
          week[index] = select.value;
        } else {
          delete week[index];
        }
        saveWeek();
      });

      li.append(label, select);
      weekPlanList.appendChild(li);
    });
  }

  addExerciseBtn.addEventListener("click", addExercise);
  exerciseNameInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addExercise();
    }
  });
  cancelBtn.addEventListener("click", resetForm);
  form.addEventListener("submit", handleSubmit);

  renderDraft();
  renderRoutines();
})();
