// ==========================================
// CURRENT USER
// ==========================================

let currentRole = "Technical Lead";

let currentUser = "Technical Lead";
// ==========================================
// ERP APPLICATION
// ==========================================

let selectedTaskId = null;


// ==========================================
// START APPLICATION
// ==========================================

document.addEventListener("DOMContentLoaded", function () {

    loadDashboard();

});


// ==========================================
// LOAD DASHBOARD
// ==========================================

function loadDashboard() {

    renderTasks();

    updateStatistics();

    generateAlerts();

}
// ==========================================
// CHANGE ROLE
// ==========================================

function changeRole() {

    const roleSelect =
        document.getElementById("roleSelect");


    currentRole =
        roleSelect.value;


    if (currentRole === "Technical Lead") {

        currentUser =
            "Technical Lead";

    }

    else if (currentRole === "Team Lead") {

        currentUser =
            "Team Lead 1";

    }

    else if (currentRole === "Member") {

        currentUser =
            "Keerthana";

    }


    const roleInfo =
        document.getElementById("roleInfo");


    if (roleInfo) {

        roleInfo.textContent =
            "Logged in as: " +
            currentUser +
            " (" +
            currentRole +
            ")";

    }


    updateRoleInterface();

    loadDashboard();

}
// ==========================================
// ROLE PERMISSIONS
// ==========================================

function updateRoleInterface() {

    const createButton =
        document.querySelector(
            ".section-header .primary-btn"
        );


    // Technical Lead

    if (currentRole === "Technical Lead") {

        if (createButton) {

            createButton.style.display =
                "block";

            createButton.textContent =
                "+ Assign Work";

        }

    }


    // Team Lead

    else if (currentRole === "Team Lead") {

        if (createButton) {

            createButton.style.display =
                "block";

            createButton.textContent =
                "+ Assign Task";

        }

    }


    // Member

    else if (currentRole === "Member") {

        if (createButton) {

            createButton.style.display =
                "none";

        }

    }

}

// ==========================================
// RENDER TASKS
// ==========================================

function renderTasks() {

    const container =
        document.getElementById("taskContainer");

    container.innerHTML = "";

    if (tasks.length === 0) {

        container.innerHTML = `
            <div class="empty">
                No tasks available.
            </div>
        `;

        return;
    }


    tasks.forEach(function (task) {

        const claimed =
            task.claimedProgress || 0;

        const verified =
            task.verifiedProgress || 0;


        let status = "Not Started";

        let statusClass = "not-started";


        if (verified === 100) {

            status = "Completed";
            statusClass = "completed";

        }

        else if (verified > 0) {

            status = "In Progress";
            statusClass = "in-progress";

        }

        else if (
            task.proofSubmitted &&
            task.verificationStatus === "pending"
        ) {

            status = "Awaiting Verification";
            statusClass = "in-progress";

        }


        const card =
            document.createElement("div");


        card.className =
            "task-card";


        card.innerHTML = `

            <div class="task-header">

                <div>

                    <h3>
                        ${task.name}
                    </h3>

                    <p>
                        Assigned to:
                        <strong>
                            ${task.member}
                        </strong>
                    </p>

                    <p>
                        Assigned by:
                        <strong>
                            ${task.assignedBy || "Technical Lead"}
                        </strong>
                    </p>

                    <p>
                        Role:
                        <strong>
                            ${task.assignedRole || "Member"}
                        </strong>
                    </p>

                </div>

                <span class="status ${statusClass}">
                    ${status}
                </span>

            </div>


            <div class="task-info">

                <p>
                    Deadline

                    <strong>
                        ${task.deadline}
                    </strong>
                </p>


                <p>
                    Claimed

                    <strong>
                        ${claimed}%
                    </strong>
                </p>


                <p>
                    Verified

                    <strong>
                        ${verified}%
                    </strong>
                </p>

            </div>


            <div class="progress-label">

                <span>
                    Verified Progress
                </span>

                <span>
                    ${verified}%
                </span>

            </div>


            <div class="progress">

                <div
                    class="progress-fill"
                    style="width:${verified}%"
                ></div>

            </div>


            <div class="task-actions">

                <button
                    class="primary-btn"
                    onclick="openProofModal(${task.id})"
                >
                    Submit Proof
                </button>

                ${task.proofSubmitted
                ?
                `
                    ${task.proofSubmitted &&
                    currentRole !== "Member"
                    ?
                    `
                            <button
                                class="review-btn"
                                onclick="reviewTask(${task.id})"
                            >
                                Review Proof
                            </button>
                        `
                    :
                    ""
                }
                `
                :
                ""
            }

            </div>


            ${task.proofSubmitted
                ?
                `
    <div class="proof-status">

        <strong>
            🔍 Proof Submitted
        </strong>

        <p>
            Proof Type:
            ${task.proofType}
        </p>

        <p>
            AI Evidence Score:
            ${task.aiScore || 0}%
        </p>

    </div>
    `
                :
                task.verificationStatus === "rejected"
                    ?
                    `
    <div class="rejected-proof">

        <strong>
            ❌ Previous Proof Rejected
        </strong>

        <p>
            Reason:
            ${task.rejectionReason || "Insufficient proof"}
        </p>

        <p>
            Please correct the work and submit new evidence.
        </p>

    </div>
    `
                    :
                    `
    <div class="no-proof">

        ⚠ No proof submitted

    </div>
    `
            }

${task.proofHistory &&
                task.proofHistory.length > 0
                ?
                `
    <div class="proof-history">

        <h4>
            📋 Proof History
        </h4>

        ${task.proofHistory.map(
                    (attempt, index) => `

            <div class="history-item">

                <div class="history-header">

                    <strong>
                        Attempt ${index + 1}
                    </strong>

                    <span class="${attempt.status === "approved"
                            ? "history-approved"
                            : "history-rejected"
                        }">

                        ${attempt.status === "approved"
                            ? "✅ Approved"
                            : "❌ Rejected"
                        }

                    </span>

                </div>

                <p>
                    Claimed:
                    ${attempt.claimedProgress}%
                </p>

                <p>
                    AI Score:
                    ${attempt.aiScore}%
                </p>

                <p>
                    Proof:
                    ${attempt.proofType || "Not specified"}
                </p>

                ${attempt.reason
                            ?
                            `
                    <p>
                        <strong>
                            Reason:
                        </strong>

                        ${attempt.reason}
                    </p>
                    `
                            :
                            ""
                        }

            </div>

        `
                ).join("")}

    </div>
    `
                :
                ""
            }

        `;


        container.appendChild(card);

    });

}


// ==========================================
// CREATE TASK
// ==========================================

function createTask() {

    const name =
        document
            .getElementById("taskName")
            .value
            .trim();


    const member =
        document
            .getElementById("taskMember")
            .value
            .trim();


    const deadline =
        document
            .getElementById("taskDeadline")
            .value;


    const weight =
        Number(
            document
                .getElementById("taskWeight")
                .value
        );


    // Validation

    if (!name) {

        alert("Please enter a task name.");

        return;

    }


    if (!member) {

        alert("Please enter the member name.");

        return;

    }


    if (!deadline) {

        alert("Please select a deadline.");

        return;

    }


    // Create task

    const newTask = {

        id: Date.now(),

        name: name,

        member: member,

        deadline: deadline,

        weight: weight || 10,


        // Role information

        assignedBy: currentUser,

        assignedRole:
            currentRole === "Technical Lead"
                ? "Team Lead"
                : "Member",


        // Progress

        claimedProgress: 0,

        verifiedProgress: 0,


        // Proof

        proofSubmitted: false,

        proofType: "",

        proofDescription: "",

        proofFile: "",

        aiScore: 0,


        // Verification

        verificationStatus:
            "not-submitted",


        // History

        proofHistory: []

    };


    // Add task

    tasks.push(newTask);


    // SAVE

    saveTasks();


    // Clear form

    document
        .getElementById("taskName")
        .value = "";


    document
        .getElementById("taskMember")
        .value = "";


    document
        .getElementById("taskDeadline")
        .value = "";


    document
        .getElementById("taskWeight")
        .value = 10;


    // Close modal

    closeTaskForm();


    // Refresh dashboard

    loadDashboard();


    alert(
        "✅ Task created successfully!"
    );

}


// ==========================================
// STATISTICS
// ==========================================

function updateStatistics() {

    if (tasks.length === 0) {

        document.getElementById(
            "overallProgress"
        ).textContent = "0%";

        document.getElementById(
            "claimedProgress"
        ).textContent = "0%";

        document.getElementById(
            "verifiedProgress"
        ).textContent = "0%";

        document.getElementById(
            "mismatchProgress"
        ).textContent = "0%";

        document.getElementById(
            "completedCount"
        ).textContent = "0";

        document.getElementById(
            "progressCount"
        ).textContent = "0";

        document.getElementById(
            "pendingCount"
        ).textContent = "0";

        document.getElementById(
            "overdueCount"
        ).textContent = "0";

        return;

    }


    let claimedTotal = 0;

    let verifiedTotal = 0;

    let completed = 0;

    let inProgress = 0;

    let pending = 0;

    let overdue = 0;


    tasks.forEach(function (task) {

        claimedTotal +=
            task.claimedProgress || 0;

        verifiedTotal +=
            task.verifiedProgress || 0;


        if (
            task.verifiedProgress === 100
        ) {

            completed++;

        }

        else if (
            task.verifiedProgress > 0
        ) {

            inProgress++;

        }


        if (
            task.proofSubmitted &&
            task.verificationStatus === "pending"
        ) {

            pending++;

        }


        if (isOverdue(task)) {

            overdue++;

        }

    });


    const claimed =
        Math.round(
            claimedTotal / tasks.length
        );


    const verified =
        Math.round(
            verifiedTotal / tasks.length
        );


    const mismatch =
        Math.max(
            0,
            claimed - verified
        );


    document.getElementById(
        "overallProgress"
    ).textContent =
        verified + "%";


    document.getElementById(
        "claimedProgress"
    ).textContent =
        claimed + "%";


    document.getElementById(
        "verifiedProgress"
    ).textContent =
        verified + "%";


    document.getElementById(
        "mismatchProgress"
    ).textContent =
        mismatch + "%";


    document.getElementById(
        "completedCount"
    ).textContent =
        completed;


    document.getElementById(
        "progressCount"
    ).textContent =
        inProgress;


    document.getElementById(
        "pendingCount"
    ).textContent =
        pending;


    document.getElementById(
        "overdueCount"
    ).textContent =
        overdue;


    document.getElementById(
        "overallBar"
    ).style.width =
        verified + "%";

}


// ==========================================
// OVERDUE
// ==========================================

function isOverdue(task) {

    if (!task.deadline) {

        return false;

    }


    if (task.verifiedProgress === 100) {

        return false;

    }


    const deadline =
        new Date(task.deadline);


    const today =
        new Date();


    return deadline < today;

}


// ==========================================
// ALERTS
// ==========================================

function generateAlerts() {

    const alerts =
        document.getElementById("alerts");


    alerts.innerHTML = "";


    let found = false;


    tasks.forEach(function (task) {

        const claimed =
            task.claimedProgress || 0;


        const verified =
            task.verifiedProgress || 0;


        // Progress mismatch

        if (
            claimed - verified >= 20
        ) {

            found = true;


            alerts.innerHTML += `

                <div class="alert warning">

                    ⚠️

                    <strong>
                        Progress mismatch:
                    </strong>

                    ${task.name}

                    <br>

                    Claimed:
                    ${claimed}%

                    |

                    Verified:
                    ${verified}%

                </div>

            `;

        }


        // Proof pending

        if (
            task.proofSubmitted &&
            task.verificationStatus === "pending"
        ) {

            found = true;


            alerts.innerHTML += `

                <div class="alert info">

                    🔍

                    <strong>
                        Proof awaiting review:
                    </strong>

                    ${task.name}

                </div>

            `;

        }


        // Overdue

        if (isOverdue(task)) {

            found = true;


            alerts.innerHTML += `

                <div class="alert danger">

                    🚨

                    <strong>
                        Overdue:
                    </strong>

                    ${task.name}

                </div>

            `;

        }

    });


    if (!found) {

        alerts.innerHTML = `

            <p class="no-alert">

                No alerts currently.

            </p>

        `;

    }

}


// ==========================================
// PROOF MODAL
// ==========================================

function openProofModal(taskId) {

    selectedTaskId = taskId;


    const task =
        tasks.find(
            t => t.id === taskId
        );


    if (!task) return;


    document.getElementById(
        "proofTaskName"
    ).textContent =
        "Task: " + task.name;


    document.getElementById(
        "proofProgress"
    ).value =
        task.claimedProgress || 100;


    document.getElementById(
        "proofModal"
    ).style.display =
        "flex";

}


function closeProofModal() {

    document.getElementById(
        "proofModal"
    ).style.display =
        "none";

}


// ==========================================
// SUBMIT PROOF
// ==========================================

function submitProof() {

    const task =
        tasks.find(
            t => t.id === selectedTaskId
        );


    if (!task) return;


    const progress =
        Number(
            document.getElementById(
                "proofProgress"
            ).value
        );


    const type =
        document.getElementById(
            "proofType"
        ).value;


    const description =
        document.getElementById(
            "proofDescription"
        ).value;


    const file =
        document.getElementById(
            "proofFile"
        ).files[0];


    if (!description && !file) {

        alert(
            "Please provide proof or upload a file."
        );

        return;

    }


    task.claimedProgress =
        progress;


    task.proofSubmitted =
        true;


    task.proofType =
        type;


    task.proofDescription =
        description;


    task.proofFile =
        file ? file.name : "";


    task.verificationStatus =
        "pending";


    // Demo AI score

    task.aiScore =
        calculateAIScore(task);


    saveTasks();


    closeProofModal();


    loadDashboard();


    alert(
        "🔍 Proof submitted successfully!"
    );

}


// ==========================================
// AI SCORE
// ==========================================

function calculateAIScore(task) {

    let score = 40;


    if (task.proofDescription) {

        score += 25;

    }


    if (task.proofFile) {

        score += 25;

    }


    if (
        task.proofType
    ) {

        score += 10;

    }


    return Math.min(
        score,
        100
    );

}


// ==========================================
// REVIEW PROOF
// ==========================================

function reviewTask(taskId) {

    const task = tasks.find(
        t => t.id === taskId
    );

    if (!task) return;


    // Make sure history exists

    if (!Array.isArray(task.proofHistory)) {

        task.proofHistory = [];

    }


    const approve = confirm(`

Task: ${task.name}

Member: ${task.member}

Claimed Progress:
${task.claimedProgress}%

AI Evidence Score:
${task.aiScore}%

Click OK to APPROVE.
Click Cancel to REJECT.

    `);


    // ======================================
    // APPROVE
    // ======================================

    if (approve) {

        // Save proof attempt

        task.proofHistory.push({

            date: new Date().toLocaleString(),

            claimedProgress:
                task.claimedProgress,

            aiScore:
                task.aiScore,

            proofType:
                task.proofType,

            status:
                "approved",

            reason:
                "Proof accepted by Team Lead"

        });


        task.verifiedProgress =
            task.claimedProgress;


        task.verificationStatus =
            "approved";


        task.proofSubmitted =
            true;


        task.rejectionReason =
            "";


        saveTasks();

        loadDashboard();


        alert(
            "✅ Proof approved! Progress is now verified."
        );

    }


    // ======================================
    // REJECT
    // ======================================

    else {

        const reason = prompt(
            "Why is the proof rejected?"
        );


        const rejectionReason =
            reason ||
            "Insufficient proof";


        // Save rejected attempt

        task.proofHistory.push({

            date: new Date().toLocaleString(),

            claimedProgress:
                task.claimedProgress,

            aiScore:
                task.aiScore,

            proofType:
                task.proofType,

            status:
                "rejected",

            reason:
                rejectionReason

        });


        // Store rejection reason

        task.rejectionReason =
            rejectionReason;


        // Reset current claim

        task.claimedProgress =
            0;


        task.verifiedProgress =
            0;


        // Allow new proof submission

        task.proofSubmitted =
            false;


        task.verificationStatus =
            "rejected";


        // Clear current proof

        task.proofType =
            "";

        task.proofDescription =
            "";

        task.proofFile =
            "";

        task.aiScore =
            0;


        saveTasks();

        loadDashboard();


        alert(
            "❌ Proof rejected. The rejection has been recorded in Proof History."
        );

    }

}


// ======================================
// APPROVE
// ======================================

if (approve) {

    task.verifiedProgress =
        task.claimedProgress;

    task.verificationStatus =
        "approved";

    task.proofSubmitted =
        true;

    task.rejectionReason =
        "";

    saveTasks();

    loadDashboard();

    alert(
        "✅ Proof approved! Progress is now verified."
    );

}


// ======================================
// REJECT
// ======================================

else {

    const reason = prompt(
        "Why is the proof rejected?"
    );


    task.rejectionReason =
        reason ||
        "Insufficient proof";


    // Reset claimed progress

    task.claimedProgress = 0;


    // Keep verified progress at 0

    task.verifiedProgress = 0;


    // Proof is no longer awaiting review

    task.proofSubmitted = false;


    task.verificationStatus =
        "rejected";


    // Clear old proof information

    task.proofType = "";

    task.proofDescription = "";

    task.proofFile = "";

    task.aiScore = 0;


    saveTasks();

    loadDashboard();


    alert(
        "❌ Proof rejected. The member must submit new proof."
    );

}




// ==========================================
// TASK MODAL
// ==========================================

function openTaskForm() {

    document.getElementById(
        "taskModal"
    ).style.display =
        "flex";

}


function closeTaskForm() {

    document.getElementById(
        "taskModal"
    ).style.display =
        "none";

}


// ==========================================
// CLOSE MODALS
// ==========================================

window.addEventListener(
    "click",
    function (event) {

        const taskModal =
            document.getElementById(
                "taskModal"
            );


        const proofModal =
            document.getElementById(
                "proofModal"
            );


        if (
            event.target === taskModal
        ) {

            closeTaskForm();

        }


        if (
            event.target === proofModal
        ) {

            closeProofModal();

        }

    }
);
// ==========================================
// TEAM CHAT
// ==========================================

let projectChat =
    JSON.parse(
        localStorage.getItem("erpChatMessages")
    ) || [];


// ==========================================
// SEND MESSAGE
// ==========================================

function sendMessage() {

    const input =
        document.getElementById("chatInput");

    if (!input) {
        alert("Chat input not found");
        return;
    }

    const message =
        input.value.trim();

    if (message === "") {
        alert("Please type a message");
        return;
    }


    // Make sure user exists

    const sender =
        typeof currentUser !== "undefined"
            ? currentUser
            : "Team Member";

    const role =
        typeof currentRole !== "undefined"
            ? currentRole
            : "Member";


    const newMessage = {

        id: Date.now(),

        sender: sender,

        role: role,

        message: message,

        time: new Date().toLocaleTimeString(
            [],
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        )

    };


    projectChat.push(newMessage);


    localStorage.setItem(
        "erpChatMessages",
        JSON.stringify(projectChat)
    );


    // Clear input

    input.value = "";


    // Display message

    renderChat();

}


// ==========================================
// DISPLAY CHAT
// ==========================================

function renderChat() {

    const container =
        document.getElementById(
            "chatMessages"
        );

    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (projectChat.length === 0) {

        container.innerHTML = `

            <div class="empty-chat">

                💬 No messages yet.

                <br>

                Start the project discussion!

            </div>

        `;

        return;
    }


    projectChat.forEach(function (chat) {

        const messageDiv =
            document.createElement("div");


        messageDiv.className =
            "chat-message";


        if (
            typeof currentUser !== "undefined" &&
            chat.sender === currentUser
        ) {

            messageDiv.classList.add(
                "my-message"
            );

        }


        messageDiv.innerHTML = `

            <div class="message-header">

                <strong>
                    ${escapeChatMessage(chat.sender)}
                </strong>

                <span class="message-role">
                    ${escapeChatMessage(chat.role)}
                </span>

                <span class="message-time">
                    ${chat.time}
                </span>

            </div>

            <div class="message-text">

                ${escapeChatMessage(chat.message)}

            </div>

        `;


        container.appendChild(messageDiv);

    });


    container.scrollTop =
        container.scrollHeight;

}


// ==========================================
// ENTER KEY
// ==========================================

function handleChatKey(event) {

    if (event.key === "Enter") {

        event.preventDefault();

        sendMessage();

    }

}


// ==========================================
// SECURITY
// ==========================================

function escapeChatMessage(message) {

    return String(message)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// ==========================================
// LOAD CHAT WHEN PAGE OPENS
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        renderChat();

    }
);