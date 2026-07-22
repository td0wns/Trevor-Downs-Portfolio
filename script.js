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
  searchQuery: "",
  sortOrder: "relevance"
};

const elements = {
  tagFilters: document.getElementById("tag-filters"),
  clearFilters: document.getElementById("clear-filters"),
  filterDescription: document.getElementById(
    "filter-description"
  ),
  search: document.getElementById("project-search"),
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
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function createFilterButtons() {
  if (!elements.tagFilters) {
    return;
  }

  elements.tagFilters.innerHTML = FILTER_TAGS
    .map(function (tag) {
      return (
        '<button ' +
          'class="tag-filter" ' +
          'type="button" ' +
          'data-tag="' +
          escapeHtml(tag) +
          '" ' +
          'aria-pressed="false">' +
          escapeHtml(tag) +
        "</button>"
      );
    })
    .join("");

  elements.tagFilters
    .querySelectorAll(".tag-filter")
    .forEach(function (button) {
      button.addEventListener("click", function () {
        const tag = button.getAttribute("data-tag");

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
  if (!elements.tagFilters) {
    return;
  }

  elements.tagFilters
    .querySelectorAll(".tag-filter")
    .forEach(function (button) {
      const tag = button.getAttribute("data-tag");
      const isActive = state.selectedTags.has(tag);

      button.classList.toggle("active", isActive);

      button.setAttribute(
        "aria-pressed",
        String(isActive)
      );
    });

  if (!elements.filterDescription) {
    return;
  }

  const selectedTags = Array.from(
    state.selectedTags
  );

  if (selectedTags.length === 0) {
    elements.filterDescription.textContent =
      "No filters selected. Showing all work.";

    return;
  }

  elements.filterDescription.textContent =
    "Matching every selected capability: " +
    selectedTags.join(" + ");
}

function projectMatchesSelectedTags(project) {
  return Array.from(state.selectedTags).every(
    function (tag) {
      return (
        Array.isArray(project.tags) &&
        project.tags.indexOf(tag) !== -1
      );
    }
  );
}

function projectMatchesSearch(project) {
  const query = state.searchQuery
    .trim()
    .toLowerCase();

  if (!query) {
    return true;
  }

  const tags = Array.isArray(project.tags)
    ? project.tags
    : [];

  const skills = Array.isArray(project.skills)
    ? project.skills
    : [];

  const outcomes = Array.isArray(project.outcomes)
    ? project.outcomes
    : [];

  const tools = Array.isArray(project.tools)
    ? project.tools
    : [];

  const searchableValues = [
    project.title,
    project.employer,
    project.summary,
    project.details,
    project.featuredMetric
  ].concat(
    tags,
    skills,
    outcomes,
    tools
  );

  const searchableText = searchableValues
    .filter(function (value) {
      return value != null;
    })
    .join(" ")
    .toLowerCase();

  return searchableText.indexOf(query) !== -1;
}

function sortProjects(projects) {
  const sortedProjects = projects.slice();

  if (state.sortOrder === "newest") {
    return sortedProjects.sort(
      function (projectA, projectB) {
        return String(
          projectB.sortDate || ""
        ).localeCompare(
          String(projectA.sortDate || "")
        );
      }
    );
  }

  if (state.sortOrder === "oldest") {
    return sortedProjects.sort(
      function (projectA, projectB) {
        return String(
          projectA.sortDate || ""
        ).localeCompare(
          String(projectB.sortDate || "")
        );
      }
    );
  }

  return sortedProjects.sort(
    function (projectA, projectB) {
      return (
        Number(projectB.priority || 0) -
        Number(projectA.priority || 0)
      );
    }
  );
}

function createProjectCard(project) {
  const pageUrl =
    typeof project.pageUrl === "string"
      ? project.pageUrl.trim()
      : "";

  const imageMarkup = project.image
    ? (
        '<img ' +
          'class="project-image" ' +
          'src="' +
          escapeHtml(project.image) +
          '" ' +
          'alt="' +
          escapeHtml(project.imageAlt || "") +
          '" ' +
          'loading="lazy">' 
      )
    : "";

  const employerMarkup = project.employer
    ? (
        '<p class="project-employer">' +
          escapeHtml(project.employer) +
        "</p>"
      )
    : "";

  const metricMarkup =
    project.featuredMetric
      ? (
          '<p class="project-metric">' +
            escapeHtml(
              project.featuredMetric
            ) +
          "</p>"
        )
      : "";

  const actionMarkup = pageUrl
    ? (
        '<span class="project-card-action">' +
          "View project " +
          '<span ' +
            'class="project-card-arrow" ' +
            'aria-hidden="true">' +
            "&rarr;" +
          "</span>" +
        "</span>"
      )
    : "";

  const tagsMarkup = Array.isArray(project.tags)
    ? project.tags
        .map(function (tag) {
          return (
            '<span class="project-tag">' +
              escapeHtml(tag) +
            "</span>"
          );
        })
        .join("")
    : "";

  const cardContents =
    imageMarkup +
    '<div class="project-content">' +
      employerMarkup +
      "<h3>" +
        escapeHtml(
          project.title || "Untitled project"
        ) +
      "</h3>" +
      '<p class="project-summary">' +
        escapeHtml(project.summary || "") +
      "</p>" +
      metricMarkup +
      actionMarkup +
      '<div class="project-tags">' +
        tagsMarkup +
      "</div>" +
    "</div>";

  if (pageUrl) {
    return (
      '<a ' +
        'class="project-card project-card-link" ' +
        'href="' +
        escapeHtml(pageUrl) +
        '" ' +
        'aria-label="View project: ' +
        escapeHtml(
          project.title || "Project"
        ) +
        '">' +
        cardContents +
      "</a>"
    );
  }

  return (
    '<article class="project-card">' +
      cardContents +
    "</article>"
  );
}

function renderProjects() {
  if (!elements.grid) {
    return;
  }

  const matchingProjects =
    state.projects.filter(function (project) {
      return (
        projectMatchesSelectedTags(project) &&
        projectMatchesSearch(project)
      );
    });

  const visibleProjects =
    sortProjects(matchingProjects);

  if (elements.resultCount) {
    elements.resultCount.textContent =
      visibleProjects.length +
      (
        visibleProjects.length === 1
          ? " project"
          : " projects"
      );
  }

  if (elements.activeFilterSummary) {
    if (state.selectedTags.size > 0) {
      elements.activeFilterSummary.textContent =
        Array.from(
          state.selectedTags
        ).join(" + ");
    } else {
      elements.activeFilterSummary.textContent =
        "Showing all work";
    }
  }

  if (elements.emptyState) {
    elements.emptyState.hidden =
      visibleProjects.length !== 0;
  }

  elements.grid.innerHTML =
    visibleProjects
      .map(function (project) {
        return createProjectCard(project);
      })
      .join("");

  elements.grid.scrollTop = 0;
}

async function loadProjects() {
  if (!elements.grid) {
    return;
  }

  try {
    const response = await fetch(
      "data/projects.json",
      {
        cache: "no-store"
      }
    );

    if (!response.ok) {
      throw new Error(
        "projects.json returned HTTP " +
        response.status
      );
    }

    const projectData =
      await response.json();

    if (!Array.isArray(projectData)) {
      throw new Error(
        "projects.json must contain a JSON array"
      );
    }

    state.projects = projectData;

    renderProjects();
  } catch (error) {
    console.error(
      "Portfolio loading error:",
      error
    );

    if (elements.resultCount) {
      elements.resultCount.textContent =
        "Projects could not be loaded";
    }

    elements.grid.innerHTML =
      '<div class="empty-state">' +
        "<h3>Projects could not be loaded</h3>" +
        "<p>" +
          escapeHtml(
            error.message || "Unknown error"
          ) +
        "</p>" +
      "</div>";
  }
}

if (elements.search) {
  elements.search.addEventListener(
    "input",
    function (event) {
      state.searchQuery =
        event.target.value;

      renderProjects();
    }
  );
}

if (elements.sort) {
  elements.sort.addEventListener(
    "change",
    function (event) {
      state.sortOrder =
        event.target.value;

      renderProjects();
    }
  );
}

if (elements.clearFilters) {
  elements.clearFilters.addEventListener(
    "click",
    function () {
      state.selectedTags.clear();
      state.searchQuery = "";

      if (elements.search) {
        elements.search.value = "";
      }

      updateFilterButtons();
      renderProjects();
    }
  );
}

if (elements.currentYear) {
  elements.currentYear.textContent =
    new Date().getFullYear();
}

createFilterButtons();
updateFilterButtons();
loadProjects();
