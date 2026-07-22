const FILTER_TAGS = [
  "Marketing",
  "Automation",
  "Salesforce & CRM",
  "Data & Analytics",
  "Commercial Strategy",
  "Operations",
  "Leadership & Stakeholder Management",
  "Events & Engagement",
  "AI-Assisted Innovation"
];

const state = {
  projects: [],
  selectedTags: new Set(),
  sortOrder: "relevance"
};

const elements = {
  tagFilters: document.getElementById("tag-filters"),
  clearFilters: document.getElementById("clear-filters"),
  filterDescription: document.getElementById(
    "filter-description"
  ),
  sort: document.getElementById("sort-order"),
  grid: document.getElementById("project-grid"),
  resultCount: document.getElementById("result-count"),
  activeFilterSummary: document.getElementById(
    "active-filter-summary"
  ),
  emptyState: document.getElementById("empty-state"),
  currentYear: document.getElementById("current-year")
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function createFilterButtons() {
  elements.tagFilters.innerHTML = FILTER_TAGS
    .map((tag) => {
      return `
        <button
          class="tag-filter"
          type="button"
          data-tag="${escapeHtml(tag)}"
          aria-pressed="false"
        >
          ${escapeHtml(tag)}
        </button>
      `;
    })
    .join("");

  const filterButtons =
    elements.tagFilters.querySelectorAll(".tag-filter");

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const tag = button.dataset.tag;

      if (state.selectedTags.has(tag)) {
        state.selectedTags.delete(tag);
      } else {
        state.selectedTags.add(tag);
      }

      updateFilterButtons();
      renderProjects();
    });
  });
}

function updateFilterButtons() {
  const filterButtons =
    elements.tagFilters.querySelectorAll(".tag-filter");

  filterButtons.forEach((button) => {
    const isActive =
      state.selectedTags.has(button.dataset.tag);

    button.classList.toggle("active", isActive);

    button.setAttribute(
      "aria-pressed",
      String(isActive)
    );
  });

  const selectedTags = [...state.selectedTags];

  if (selectedTags.length === 0) {
    elements.filterDescription.textContent =
      "No filters selected. Showing all work.";

    return;
  }

  elements.filterDescription.textContent =
    `Matching every selected capability: ${
      selectedTags.join(" + ")
    }`;
}

function projectMatchesSelectedTags(project) {
  return [...state.selectedTags].every((tag) => {
    return (
      Array.isArray(project.tags) &&
      project.tags.includes(tag)
    );
  });
}

function sortProjects(projects) {
  const sortedProjects = [...projects];

  if (state.sortOrder === "newest") {
    return sortedProjects.sort((projectA, projectB) => {
      return String(projectB.sortDate || "")
        .localeCompare(
          String(projectA.sortDate || "")
        );
    });
  }

  if (state.sortOrder === "oldest") {
    return sortedProjects.sort((projectA, projectB) => {
      return String(projectA.sortDate || "")
        .localeCompare(
          String(projectB.sortDate || "")
        );
    });
  }

  return sortedProjects.sort((projectA, projectB) => {
    return (
      Number(projectB.priority || 0) -
      Number(projectA.priority || 0)
    );
  });
}

function createProjectCard(project) {
  const imageMarkup = project.image
    ? `
      <img
        class="project-image"
        src="${escapeHtml(project.image)}"
        alt="${escapeHtml(project.imageAlt || "")}"
        loading="lazy"
      >
    `
    : "";

  const employerMarkup = project.employer
    ? `
      <p class="project-employer">
        ${escapeHtml(project.employer)}
      </p>
    `
    : "";

  const metricMarkup = project.featuredMetric
    ? `
      <p class="project-metric">
        ${escapeHtml(project.featuredMetric)}
      </p>
    `
    : "";

  const tagsMarkup = (project.tags || [])
    .map((tag) => {
      return `
        <span class="project-tag">
          ${escapeHtml(tag)}
        </span>
      `;
    })
    .join("");

  return `
    <article class="project-card">
      ${imageMarkup}

      <div class="project-content">
        ${employerMarkup}

        <h3>
          ${escapeHtml(
            project.title || "Untitled project"
          )}
        </h3>

        <p class="project-summary">
          ${escapeHtml(project.summary || "")}
        </p>

        ${metricMarkup}

        <div class="project-tags">
          ${tagsMarkup}
        </div>
      </div>
    </article>
  `;
}

function renderProjects() {
  const matchingProjects = state.projects.filter(
    (project) => {
      return projectMatchesSelectedTags(project);
    }
  );

  const visibleProjects =
    sortProjects(matchingProjects);

  const projectWord =
    visibleProjects.length === 1
      ? "project"
      : "projects";

  elements.resultCount.textContent =
    `${visibleProjects.length} ${projectWord}`;

  if (state.selectedTags.size > 0) {
    elements.activeFilterSummary.textContent =
      [...state.selectedTags].join(" + ");
  } else {
    elements.activeFilterSummary.textContent =
      "Showing all work";
  }

  elements.emptyState.hidden =
    visibleProjects.length !== 0;

  elements.grid.innerHTML = visibleProjects
    .map((project) => {
      return createProjectCard(project);
    })
    .join("");
}

async function loadProjects() {
  try {
    const response = await fetch(
      "data/projects.json",
      {
        cache: "no-store"
      }
    );

    if (!response.ok) {
      throw new Error(
        `Unable to load projects.json: ${response.status}`
      );
    }

    const projectData = await response.json();

    if (!Array.isArray(projectData)) {
      throw new Error(
        "projects.json must contain a JSON array."
      );
    }

    state.projects = projectData;

    renderProjects();
  } catch (error) {
    console.error(error);

    elements.resultCount.textContent =
      "Projects could not be loaded";

    elements.grid.innerHTML = `
      <div class="empty-state">
        <h3>Projects could not be loaded</h3>

        <p>
          Check that data/projects.json exists
          and contains valid JSON.
        </p>
      </div>
    `;
  }
}

elements.sort.addEventListener(
  "change",
  (event) => {
    state.sortOrder = event.target.value;

    renderProjects();
  }
);

elements.clearFilters.addEventListener(
  "click",
  () => {
    state.selectedTags.clear();

    updateFilterButtons();
    renderProjects();
  }
);

elements.currentYear.textContent =
  new Date().getFullYear();

createFilterButtons();
updateFilterButtons();
loadProjects();
