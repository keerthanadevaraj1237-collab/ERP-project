// ==========================================
// ERP DATA
// ==========================================

let tasks = JSON.parse(
  localStorage.getItem("erpTasks")
) || [];


// Existing task compatibility
tasks.forEach(task => {

  if (!Array.isArray(task.proofHistory)) {
    task.proofHistory = [];
  }

  if (!task.assignedBy) {
    task.assignedBy = "Technical Lead";
  }

  if (!task.assignedRole) {
    task.assignedRole = "Member";
  }

});


// Team structure

const teamStructure = {

  technicalLead: {
    name: "Technical Lead",
    members: [
      "Team Lead 1",
      "Team Lead 2"
    ]
  },

  teamLeads: {

    "Team Lead 1": [
      "Keerthana",
      "Manasi",
      "Member 3"
    ],

    "Team Lead 2": [
      "Member 4",
      "Member 5",
      "Member 6"
    ]

  }

};


// Save tasks

function saveTasks() {

  localStorage.setItem(
    "erpTasks",
    JSON.stringify(tasks)
  );

}