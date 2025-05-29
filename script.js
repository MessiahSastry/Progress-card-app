let schoolData = {
  classes: [
    "Nursery", "LKG", "UKG", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th"
  ],
  sections: {},
  students: {},
  currentClass: null,
  currentSection: null,
};
const colors = [
  "#d72631", "#f46036", "#2d82b7", "#2eb872", "#63458a",
  "#edc988", "#638475", "#bc4b51", "#447604", "#a23e48",
  "#395b50", "#5c3c92", "#1b3a4b"
];
const addClassModal = document.getElementById('addClassModal');
const addSectionModal = document.getElementById('addSectionModal');
const addStudentModal = document.getElementById('addStudentModal');
const newClassNameInput = document.getElementById('newClassName');
const createClassBtn = document.getElementById('createClassBtn');
const closeAddClass = document.getElementById('closeAddClass');
const newSectionNameInput = document.getElementById('newSectionName');
const createSectionBtn = document.getElementById('createSectionBtn');
const closeAddSection = document.getElementById('closeAddSection');
const studentNameInput = document.getElementById('studentName');
const fatherNameInput = document.getElementById('fatherName');
const rollNumberInput = document.getElementById('rollNumber');
const saveStudentBtn = document.getElementById('saveStudentBtn');
const closeAddStudent = document.getElementById('closeAddStudent');

const longPressModal = document.getElementById('longPressModal');
const longPressContent = document.getElementById('longPressContent');
const sectionModalTitle = document.getElementById('sectionModalTitle');
const studentModalTitle = document.getElementById('studentModalTitle');

let editSectionIndex = null;
let editStudentIndex = null;

// Hide modals when clicking close or outside
function closeAllModals() {
  addClassModal.style.display = 'none';
  addSectionModal.style.display = 'none';
  addStudentModal.style.display = 'none';
  longPressModal.style.display = 'none';
}
closeAddClass.onclick = () => addClassModal.style.display = 'none';
closeAddSection.onclick = () => addSectionModal.style.display = 'none';
closeAddStudent.onclick = () => addStudentModal.style.display = 'none';
window.onclick = function(event) {
  if (event.target === addClassModal) addClassModal.style.display = 'none';
  if (event.target === addSectionModal) addSectionModal.style.display = 'none';
  if (event.target === addStudentModal) addStudentModal.style.display = 'none';
  if (event.target === longPressModal) longPressModal.style.display = 'none';
};

// Modal scroll for mobile keyboard (auto-move up & never disappear)
function setupModalAutoUp(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  const modalContent = modal.querySelector('.modal-content');
  const inputs = modal.querySelectorAll('input');
  let focusCount = 0;

  function stickModalTop() {
    modal.classList.add('modal-up');
  }

  function unstickModal() {
    modal.classList.remove('modal-up');
  }

  inputs.forEach(input => {
    input.addEventListener('focus', () => {
      focusCount++;
      stickModalTop();
      setTimeout(() => {
        modalContent.scrollIntoView({behavior: 'smooth', block: 'start'});
      }, 100);
    });
    input.addEventListener('blur', () => {
      focusCount--;
      setTimeout(() => {
        if (focusCount <= 0) unstickModal();
      }, 350);
    });
  });
}
setupModalAutoUp('addStudentModal');
setupModalAutoUp('addSectionModal');
setupModalAutoUp('addClassModal');

// Add Class
createClassBtn.onclick = () => {
  const newClassName = newClassNameInput.value.trim();
  if (!newClassName) return alert('Please enter a class name.');
  if (schoolData.classes.includes(newClassName)) return alert('Class already exists.');
  schoolData.classes.push(newClassName);
  schoolData.sections[newClassName] = [];
  addClassModal.style.display = 'none';
  render();
};

// Add/Edit Section
let isEditingSection = false;
createSectionBtn.onclick = () => {
  const newSectionName = newSectionNameInput.value.trim();
  if (!newSectionName) return alert('Please enter a section name.');
  if (isEditingSection && editSectionIndex !== null) {
    // Edit existing
    let sections = schoolData.sections[schoolData.currentClass];
    let oldName = sections[editSectionIndex];
    if (sections.includes(newSectionName) && oldName !== newSectionName)
      return alert('Section already exists.');
    // Rename students key
    const oldKey = schoolData.currentClass + '_' + oldName;
    const newKey = schoolData.currentClass + '_' + newSectionName;
    schoolData.sections[schoolData.currentClass][editSectionIndex] = newSectionName;
    if (schoolData.students[oldKey]) {
      schoolData.students[newKey] = schoolData.students[oldKey];
      delete schoolData.students[oldKey];
    }
    if (schoolData.currentSection === oldName) {
      schoolData.currentSection = newSectionName;
    }
    isEditingSection = false;
    editSectionIndex = null;
    addSectionModal.style.display = 'none';
    render();
    return;
  }
  // Add new
  if (schoolData.sections[schoolData.currentClass].includes(newSectionName))
    return alert('Section already exists.');
  schoolData.sections[schoolData.currentClass].push(newSectionName);
  schoolData.students[schoolData.currentClass + '_' + newSectionName] = [];
  addSectionModal.style.display = 'none';
  render();
};
function openEditSectionModal(index) {
  isEditingSection = true;
  editSectionIndex = index;
  sectionModalTitle.textContent = "Edit Section";
  newSectionNameInput.value = schoolData.sections[schoolData.currentClass][index];
  addSectionModal.style.display = 'flex';
  newSectionNameInput.focus();
}

// Add/Edit Student
let isEditingStudent = false;
createStudentBtnHandler = function () {}; // placeholder for code order

saveStudentBtn.onclick = () => {
  const name = studentNameInput.value.trim();
  const father = fatherNameInput.value.trim();
  const roll = rollNumberInput.value.trim();
  const key = schoolData.currentClass + '_' + schoolData.currentSection;
  if (!name || !roll) return alert('Please enter student name and roll number.');

  if (isEditingStudent && editStudentIndex !== null) {
    // Edit existing student
    let students = schoolData.students[key];
    if (students.some((s, idx) => s.roll === roll && idx !== editStudentIndex))
      return alert('Roll number already exists in this section.');
    students[editStudentIndex] = { name, father, roll };
    isEditingStudent = false;
    editStudentIndex = null;
    addStudentModal.style.display = 'none';
    render();
    return;
  }
  // Add new student
  schoolData.students[key] = schoolData.students[key] || [];
  if (schoolData.students[key].some(s => s.roll === roll)) return alert('Roll number already exists in this section.');
  schoolData.students[key].push({ name, father, roll });
  schoolData.students[key].sort((a, b) => Number(a.roll) - Number(b.roll));
  addStudentModal.style.display = 'none';
  render();
};
function openEditStudentModal(index) {
  isEditingStudent = true;
  editStudentIndex = index;
  studentModalTitle.textContent = "Edit Student";
  const key = schoolData.currentClass + '_' + schoolData.currentSection;
  const s = schoolData.students[key][index];
  studentNameInput.value = s.name;
  fatherNameInput.value = s.father;
  rollNumberInput.value = s.roll;
  addStudentModal.style.display = 'flex';
  studentNameInput.focus();
}

// -- Long Press Handler --
function setupLongPress(element, onLongPress) {
  let pressTimer = null;
  let longPressed = false;
  let startX, startY;

  function touchStart(e) {
    longPressed = false;
    if (e.touches) {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }
    pressTimer = setTimeout(() => {
      longPressed = true;
      onLongPress(e);
    }, 550);
  }
  function touchEnd(e) {
    clearTimeout(pressTimer);
  }
  function touchMove(e) {
    // If finger moves a lot, cancel
    if (!e.touches) return;
    if (Math.abs(e.touches[0].clientX - startX) > 18 || Math.abs(e.touches[0].clientY - startY) > 18) {
      clearTimeout(pressTimer);
    }
  }
  element.addEventListener('touchstart', touchStart);
  element.addEventListener('touchend', touchEnd);
  element.addEventListener('touchmove', touchMove);
  element.addEventListener('mousedown', (e) => {
    e.preventDefault();
    pressTimer = setTimeout(() => {
      longPressed = true;
      onLongPress(e);
    }, 600);
  });
  element.addEventListener('mouseup', touchEnd);
  element.addEventListener('mouseleave', touchEnd);
}

// Main Render Function
function render() {
  const app = document.getElementById('app');
  if (!schoolData.currentClass) {
    let html = `<h2 style="text-align:left;margin-bottom:16px;">Select Class</h2><div id="classButtons">`;
    schoolData.classes.forEach((cls, i) => {
      html += `<button class="class-btn" style="border-color:${colors[i % colors.length]}; color:${colors[i % colors.length]}">${cls}</button>`;
    });
    html += `</div><button class="add-btn" id="openAddClassModal">+ Add Class</button>`;
    app.innerHTML = html;
    // Class button events
    Array.from(document.getElementsByClassName('class-btn')).forEach((btn, i) => {
      btn.onclick = () => {
        const cls = schoolData.classes[i];
        schoolData.currentClass = cls;
        if (!schoolData.sections[cls]) schoolData.sections[cls] = [];
        render();
      }
    });
    document.getElementById('openAddClassModal').onclick = () => {
      newClassNameInput.value = '';
      addClassModal.style.display = 'flex';
      newClassNameInput.focus();
    };
    return;
  }
  if (!schoolData.currentSection) {
    app.innerHTML = `
      <div class="bar-row">
        <button id="back-btn">&#8592; Back</button>
        <button class="add-btn" id="addSectionBtn">+ Create Section</button>
      </div>
      <div class="page-title">${schoolData.currentClass}: Sections</div>
      <div id="sectionList"></div>
    `;
    document.getElementById('back-btn').onclick = () => {
      schoolData.currentClass = null;
      render();
    };
    document.getElementById('addSectionBtn').onclick = () => {
      isEditingSection = false;
      editSectionIndex = null;
      sectionModalTitle.textContent = "Create Section";
      newSectionNameInput.value = '';
      addSectionModal.style.display = 'flex';
      newSectionNameInput.focus();
    };
    const sectionList = document.getElementById('sectionList');
    sectionList.innerHTML = '';
    schoolData.sections[schoolData.currentClass].forEach((section, idx) => {
      const div = document.createElement('div');
      div.textContent = section;
      div.className = 'section-item';
      div.onclick = () => {
        schoolData.currentSection = section;
        if (!schoolData.students[schoolData.currentClass + '_' + section])
          schoolData.students[schoolData.currentClass + '_' + section] = [];
        render();
      };
      // Long-press
      setupLongPress(div, (e) => {
        showSectionOptions(idx);
      });
      sectionList.appendChild(div);
    });
    return;
  }
  // Students page
  const key = schoolData.currentClass + '_' + schoolData.currentSection;
  app.innerHTML = `
    <div class="bar-row">
      <button id="back-btn">&#8592; Back</button>
      <button class="add-btn" id="addStudentBtn">+ Add Student</button>
    </div>
    <div class="page-title">${schoolData.currentClass} - ${schoolData.currentSection}: Students</div>
    <div id="studentsList"></div>
  `;
  document.getElementById('back-btn').onclick = () => {
    schoolData.currentSection = null;
    render();
  };
  document.getElementById('addStudentBtn').onclick = () => {
    isEditingStudent = false;
    editStudentIndex = null;
    studentModalTitle.textContent = "Add Student";
    studentNameInput.value = '';
    fatherNameInput.value = '';
    rollNumberInput.value = '';
    addStudentModal.style.display = 'flex';
    studentNameInput.focus();
  };
  const studentsList = document.getElementById('studentsList');
  studentsList.innerHTML = '';
  (schoolData.students[key] || []).forEach((student, idx) => {
    const div = document.createElement('div');
    div.textContent = `(${student.roll}) ${student.name}`;
    div.className = 'student-item';
    // Long-press
    setupLongPress(div, (e) => {
      showStudentOptions(idx);
    });
    studentsList.appendChild(div);
  });
}

// Section Long-press Options
function showSectionOptions(idx) {
  longPressContent.innerHTML = `
    <div class="longpress-option" id="editSectionOpt">Edit</div>
    <div class="longpress-option" id="deleteSectionOpt" style="color:#d72631;">Delete</div>
  `;
  longPressModal.style.display = 'flex';
  document.getElementById('editSectionOpt').onclick = () => {
    longPressModal.style.display = 'none';
    openEditSectionModal(idx);
  };
  document.getElementById('deleteSectionOpt').onclick = () => {
    longPressModal.style.display = 'none';
    if (confirm("Are you sure you want to delete this section? All its students will be lost!")) {
      // Remove section and students
      let secName = schoolData.sections[schoolData.currentClass][idx];
      let stuKey = schoolData.currentClass + '_' + secName;
      schoolData.sections[schoolData.currentClass].splice(idx, 1);
      delete schoolData.students[stuKey];
      // If you are in this section, go back
      if (schoolData.currentSection === secName) {
        schoolData.currentSection = null;
      }
      render();
    }
  };
}

// Student Long-press Options
function showStudentOptions(idx) {
  longPressContent.innerHTML = `
    <div class="longpress-option" id="editStudentOpt">Edit</div>
    <div class="longpress-option" id="deleteStudentOpt" style="color:#d72631;">Delete</div>
  `;
  longPressModal.style.display = 'flex';
  document.getElementById('editStudentOpt').onclick = () => {
    longPressModal.style.display = 'none';
    openEditStudentModal(idx);
  };
  document.getElementById('deleteStudentOpt').onclick = () => {
    longPressModal.style.display = 'none';
    if (confirm("Are you sure you want to delete this student?")) {
      const key = schoolData.currentClass + '_' + schoolData.currentSection;
      schoolData.students[key].splice(idx, 1);
      render();
    }
  };
}

window.onload = render;
