// Default classes: always show these in order
let defaultClasses = [
  "Nursery","LKG","UKG","1st","2nd","3rd","4th","5th","6th","7th","8th","9th","10th"
];
let classes = [];
let subjectsByExam = {};
let currentClass = null, currentSection = null, currentStudent = null;
let sectionColors = ["#e74c3c","#fdc600","#27ae60","#2980b9","#e67e22","#9b59b6","#f39c12","#e84393","#00b894","#fdc600"];
let lastPopup = null;
let historyStack = [];
let firstLoad = true;

// --- Data Save/Load ---
function saveData() {
  localStorage.setItem('sp_classes', JSON.stringify(classes));
  localStorage.setItem('sp_subjectsByExam', JSON.stringify(subjectsByExam));
}
function loadData() {
  let d = localStorage.getItem('sp_classes');
  if (d) {
    let loaded = JSON.parse(d);
    // Always rebuild class list: defaults in order, then user-added
    classes = defaultClasses.map(name=>{
      let found = loaded.find(c=>c.name===name);
      return found ? found : {name,sections:[]};
    });
    loaded.forEach(c=>{
      if(!defaultClasses.includes(c.name)) classes.push(c);
    });
  }
  else {
    classes = defaultClasses.map(name=>({name,sections:[]}));
  }
  let s = localStorage.getItem('sp_subjectsByExam');
  if (s) subjectsByExam = JSON.parse(s);
  else subjectsByExam = {};
}

// --- Splash ---
setTimeout(()=>{
  document.getElementById('splash').classList.add('hidden');
  showClassList();
},1300);

// ---- UI Screens ----
function showClassList(push=true) {
  currentClass = null; currentSection = null; currentStudent = null;
  document.getElementById('header-exam').textContent = "";
  let html = `<div class="screen-title">Select a Class</div>
  <div class="class-list">`;
  let colors = sectionColors;
  classes.forEach((cls, idx) => {
    let border = colors[idx%colors.length];
    html += `<button class="class-btn" style="border-color:${border};color:${border};"
      onmousedown="onClassLongPress(${idx},event)" ontouchstart="onClassLongPress(${idx},event)"
      onclick="showSectionList(${idx},true)">${cls.name}</button>`;
  });
  html += '</div>';
  document.getElementById("main-area").innerHTML = html;
  showFAB("+", ()=>showAddPopup("class"));
  showSettingsBtn(false);
  if(push) pushHistory("classList");
}
function showSectionList(classIdx,push=true) {
  currentClass = classes[classIdx];
  currentSection = null;
  // Alphabetical section sort
  let sections = [...currentClass.sections].sort((a,b)=>a.name.localeCompare(b.name));
  let html = `<div class="screen-title">${currentClass.name} – Sections</div><div class="section-list">`;
  sections.forEach((sec, idx) => {
    html += `<div class="section-chip" style="border-color:${sectionColors[idx%sectionColors.length]}"
    onmousedown="onSectionLongPress(${classIdx},${currentClass.sections.indexOf(sec)},event)" ontouchstart="onSectionLongPress(${classIdx},${currentClass.sections.indexOf(sec)},event)"
    onclick="showStudentList(${classIdx},${currentClass.sections.indexOf(sec)},true)">${sec.name}</div>`;
  });
  html += '</div>';
  document.getElementById("main-area").innerHTML = html;
  showFAB("+", ()=>showAddPopup("section"));
  showSettingsBtn(false);
  if(push) pushHistory("sectionList",classIdx);
}
// Section Long Press
let sectionTimer = null;
function onSectionLongPress(classIdx, secIdx, event) {
  sectionTimer = setTimeout(()=> {
    let section = classes[classIdx].sections[secIdx];
    showSectionOptions(classIdx,secIdx,section);
  }, 650);
  event.target.onmouseup = event.target.ontouchend = ()=>clearTimeout(sectionTimer);
}
function showSectionOptions(classIdx,secIdx,section) {
  let html = `<div class="popup-bg" id="popup-bg">
    <div class="popup">
      <div style="margin-bottom:10px;">Section: <b>${section.name}</b></div>
      <div class="option-row">
        <button class="option-btn" onclick="editSection(${classIdx},${secIdx})">Edit</button>
        <button class="option-btn" onclick="deleteSectionConfirm(${classIdx},${secIdx})">Delete</button>
        <button class="cancel-btn" onclick="closePopup()">Cancel</button>
      </div>
    </div></div>`;
  showPopup(html);
}
function editSection(classIdx,secIdx) {
  let section = classes[classIdx].sections[secIdx];
  let html = `<div class="popup-bg" id="popup-bg">
    <form class="popup" onsubmit="submitEditSection(event,${classIdx},${secIdx})">
      <label>Edit Section Name</label>
      <input name="sectionName" value="${section.name}" required>
      <div class="btn-row">
        <button type="button" class="cancel-btn" onclick="closePopup()">Cancel</button>
        <button>Save</button>
      </div>
    </form></div>`;
  showPopup(html);
}
function submitEditSection(e,classIdx,secIdx) {
  e.preventDefault();
  let val = e.target.sectionName.value.trim();
  if(!val) return;
  classes[classIdx].sections[secIdx].name = val;
  saveData(); closePopup(); showSectionList(classIdx,false);
}
function deleteSectionConfirm(classIdx,secIdx) {
  let html = `<div class="popup-bg" id="popup-bg">
    <div class="popup">
      <div>Are you sure you want to delete section <b>${classes[classIdx].sections[secIdx].name}</b>?</div>
      <div class="btn-row" style="margin-top:8px;">
        <button type="button" class="cancel-btn" onclick="closePopup()">No</button>
        <button onclick="deleteSectionSecondConfirm(${classIdx},${secIdx})">Yes</button>
      </div>
    </div></div>`;
  showPopup(html);
}
function deleteSectionSecondConfirm(classIdx,secIdx) {
  let html = `<div class="popup-bg" id="popup-bg">
    <div class="popup">
      <div><b>Confirm again</b> to delete section <b>${classes[classIdx].sections[secIdx].name}</b>!</div>
      <div class="btn-row" style="margin-top:8px;">
        <button type="button" class="cancel-btn" onclick="closePopup()">No</button>
        <button onclick="deleteSection(${classIdx},${secIdx})">Delete</button>
      </div>
    </div></div>`;
  showPopup(html);
}
function deleteSection(classIdx,secIdx) {
  classes[classIdx].sections.splice(secIdx,1);
  saveData(); closePopup(); showSectionList(classIdx,false);
}
// Students
function showStudentList(classIdx, secIdx,push=true) {
  currentClass = classes[classIdx];
  currentSection = currentClass.sections[secIdx];
  currentStudent = null;
  let title = `${currentClass.name} – Section ${currentSection.name}`;
  let html = `<div class="screen-title">${title}</div>
  <div class="student-list">`;
  let list = [...currentSection.students];
  list.sort((a,b)=>parseInt(a.roll)-parseInt(b.roll));
  list.forEach((stu, idx) => {
    html += `<div class="student-row" 
      onmousedown="onStudentLongPress(${classIdx},${secIdx},${idx},event)" 
      ontouchstart="onStudentLongPress(${classIdx},${secIdx},${idx},event)">
      <span class="roll-no">${stu.roll}.</span> ${stu.name}
      </div>`;
  });
  html += '</div>';
  document.getElementById("main-area").innerHTML = html;
  showFAB("+", ()=>showAddPopup("student"));
  showSettingsBtn(true);
  if(push) pushHistory("studentList",classIdx,secIdx);
}
// Student Long Press
let studentTimer = null;
function onStudentLongPress(classIdx,secIdx,stuIdx,event) {
  studentTimer = setTimeout(()=> {
    let stu = classes[classIdx].sections[secIdx].students[stuIdx];
    showStudentOptions(classIdx,secIdx,stuIdx,stu);
  }, 650);
  event.target.onmouseup = event.target.ontouchend = ()=>clearTimeout(studentTimer);
}
function showStudentOptions(classIdx,secIdx,stuIdx,stu) {
  let html = `<div class="popup-bg" id="popup-bg">
    <div class="popup">
      <div style="margin-bottom:8px;">${stu.roll}. <b>${stu.name}</b></div>
      <div class="option-row">
        <button class="option-btn" onclick="editStudent(${classIdx},${secIdx},${stuIdx})">Edit</button>
        <button class="option-btn" onclick="deleteStudentConfirm(${classIdx},${secIdx},${stuIdx})">Delete</button>
        <button class="cancel-btn" onclick="closePopup()">Cancel</button>
      </div>
    </div></div>`;
  showPopup(html);
}
function editStudent(classIdx,secIdx,stuIdx) {
  let stu = classes[classIdx].sections[secIdx].students[stuIdx];
  let html = `<div class="popup-bg" id="popup-bg">
    <form class="popup" onsubmit="submitEditStudent(event,${classIdx},${secIdx},${stuIdx})">
      <label>Student Name</label>
      <input name="studentName" value="${stu.name}" required>
      <label>Father's Name</label>
      <input name="fatherName" value="${stu.father||''}">
      <label>Roll Number</label>
      <input name="rollNo" type="number" min="1" max="999" value="${stu.roll}" required>
      <div class="btn-row">
        <button type="button" class="cancel-btn" onclick="closePopup()">Cancel</button>
        <button>Save</button>
      </div>
    </form></div>`;
  showPopup(html);
}
function submitEditStudent(e,classIdx,secIdx,stuIdx) {
  e.preventDefault();
  let form = e.target;
  classes[classIdx].sections[secIdx].students[stuIdx].name = form.studentName.value.trim();
  classes[classIdx].sections[secIdx].students[stuIdx].father = form.fatherName.value.trim();
  classes[classIdx].sections[secIdx].students[stuIdx].roll = form.rollNo.value.trim();
  saveData(); closePopup(); showStudentList(classIdx, secIdx,false);
}
function deleteStudentConfirm(classIdx,secIdx,stuIdx) {
  let stu = classes[classIdx].sections[secIdx].students[stuIdx];
  let html = `<div class="popup-bg" id="popup-bg">
    <div class="popup">
      <div>Are you sure you want to delete <b>${stu.name}</b>?</div>
      <div class="btn-row" style="margin-top:7px;">
        <button type="button" class="cancel-btn" onclick="closePopup()">No</button>
        <button onclick="deleteStudentSecondConfirm(${classIdx},${secIdx},${stuIdx})">Yes</button>
      </div>
    </div></div>`;
  showPopup(html);
}
function deleteStudentSecondConfirm(classIdx,secIdx,stuIdx) {
  let stu = classes[classIdx].sections[secIdx].students[stuIdx];
  let html = `<div class="popup-bg" id="popup-bg">
    <div class="popup">
      <div><b>Confirm again</b> to delete <b>${stu.name}</b>!</div>
      <div class="btn-row" style="margin-top:7px;">
        <button type="button" class="cancel-btn" onclick="closePopup()">No</button>
        <button onclick="deleteStudent(${class
  saveData(); closePopup(); showClassList(false);
}
function addSection(form) {
  const name = form.sectionName.value.trim();
  if (!name) return;
  currentClass.sections.push({name,students:[]});
  saveData(); closePopup();
  showSectionList(classes.indexOf(currentClass),false);
}
function addStudent(form) {
  const name = form.studentName.value.trim();
  const father = form.fatherName.value.trim();
  const roll = form.rollNo.value.trim();
  if (!name || !father || !roll) return;
  currentSection.students.push({name,father,roll,marks:{}});
  saveData(); closePopup();
  showStudentList(classes.indexOf(currentClass), currentClass.sections.indexOf(currentSection),false);
}

// FAB & Settings
function showFAB(label,onClick) {
  let fab = document.getElementById('fab');
  fab.innerHTML = label;
  fab.style.display = "flex";
  fab.onclick = onClick;
}
function showSettingsBtn(show) {
  let btn = document.getElementById('settings-btn');
  btn.style.display = show?"flex":"none";
}

// Settings Popup
function showSettingsPopup() {
  let html = `<div class="popup-bg" id="popup-bg">
    <div class="popup">
      <div style="font-weight:600;color:#0f3d6b;margin-bottom:9px;font-size:1.08em;">Settings & Actions</div>
      <div class="option-row" style="flex-direction:column;gap:11px;">
        <button class="option-btn" onclick="showExamSettingsPopup()">Exam Settings</button>
        <button class="option-btn" onclick="showEnterMarksPopup()">Enter Marks</button>
        <button class="option-btn" onclick="alert('Download Class Marks Memo coming soon!')">Download Class Marks Memos (PDF)</button>
        <button class="option-btn" onclick="alert('Coming soon!')">Download Hall Tickets</button>
        <button class="option-btn" onclick="alert('Coming soon!')">Download Class Marks (Excel)</button>
        <button class="option-btn" onclick="closePopup()">Close</button>
      </div>
    </div>
  </div>`;
  showPopup(html);
}

// Exam Settings
function showExamSettingsPopup() {
  let html = `<div class="popup-bg" id="popup-bg">
  <div class="popup" style="max-width: 400px;">
    <div style="font-weight:600;font-size:1.03em;color:#0f3d6b;margin-bottom:8px;">Saved Exams</div>
    <div id="examListArea"></div>
    <form onsubmit="addExamSetting(event)" style="margin-top:14px;">
      <label>Exam Name</label>
      <input name="examName" maxlength="25" required>
      <div id="subjectsArea">
        <div style="font-weight:600;color:#0f3d6b;margin-top:8px;">Add Subjects</div>
        <div>
          <input id="subjectName" placeholder="Subject name" style="width:49%;" maxlength="22">
          <input id="maxMarks" type="number" min="1" max="200" placeholder="Max marks" style="width:33%;">
          <button type="button" onclick="addSubjectRow()" style="margin-left:5px;padding:5px 11px;border-radius:6px;">Add</button>
        </div>
        <div class="subjects-list" id="subjects-list"></div>
      </div>
      <div class="btn-row" style="margin-top:9px;">
        <button type="button" class="cancel-btn" onclick="closePopup()">Cancel</button>
        <button>Save Exam</button>
      </div>
    </form>
  </div></div>`;
  showPopup(html);
  window.subjectRows = [];
  updateSubjectsList();
  showExamList();
  enableExamLongPress();
}
function showExamList() {
  let area = document.getElementById('examListArea');
  if (!area) return;
  let html = "";
  Object.keys(subjectsByExam).forEach((exam,i)=>{
    html += `<div class="exam-list-item" style="padding:10px 0 6px 0; font-size:1.08em; font-weight:600; color:#0982cc; user-select:none; cursor:pointer;" 
    onmousedown="onExamLongPress('${exam.replace(/'/g,"\\'")}',event)" ontouchstart="onExamLongPress('${exam.replace(/'/g,"\\'")}',event)">
    ${exam}
    </div>`;
  });
  area.innerHTML = html || `<span style="color:#b8b8b8;font-size:1.01em;">No exams saved yet.</span>`;
}
// Exam Long Press for Edit/Delete
let examTimer = null;
function onExamLongPress(exam, event) {
  examTimer = setTimeout(()=>{
    showExamOptions(exam);
  }, 650);
  event.target.onmouseup = event.target.ontouchend = ()=>clearTimeout(examTimer);
}
function showExamOptions(exam) {
  let html = `<div class="popup-bg" id="popup-bg">
    <div class="popup">
      <div style="margin-bottom:10px;"><b>${exam}</b></div>
      <div class="option-row">
        <button class="option-btn" onclick="editExam('${exam.replace(/'/g,"\\'")}')">Edit</button>
        <button class="option-btn" onclick="deleteExamConfirm('${exam.replace(/'/g,"\\'")}')">Delete</button>
        <button class="cancel-btn" onclick="closePopup()">Cancel</button>
      </div>
    </div></div>`;
  showPopup(html);
}
function editExam(exam) {
  // Pre-fill with existing subjects
  let subjects = subjectsByExam[exam] || [];
  window.subjectRows = JSON.parse(JSON.stringify(subjects));
  let html = `<div class="popup-bg" id="popup-bg">
    <form class="popup" onsubmit="submitEditExam(event,'${exam.replace(/'/g,"\\'")}')">
      <label>Edit Exam Name</label>
      <input name="examName" value="${exam}" maxlength="25" required>
      <div id="subjectsArea">
        <div style="font-weight:600;color:#0f3d6b;margin-top:8px;">Edit Subjects</div>
        <div>
          <input id="subjectName" placeholder="Subject name" style="width:49%;" maxlength="22">
          <input id="maxMarks" type="number" min="1" max="200" placeholder="Max marks" style="width:33%;">
          <button type="button" onclick="addSubjectRow()" style="margin-left:5px;padding:5px 11px;border-radius:6px;">Add</button>
        </div>
        <div class="subjects-list" id="subjects-list"></div>
      </div>
      <div class="btn-row" style="margin-top:9px;">
        <button type="button" class="cancel-btn" onclick="closePopup()">Cancel</button>
        <button>Save</button>
      </div>
    </form>
  </div>`;
  showPopup(html);
  updateSubjectsList();
}
function submitEditExam(e,oldExam) {
  e.preventDefault();
  let newExam = e.target.examName.value.trim();
  if(!newExam) return;
  if((window.subjectRows||[]).length<1) { alert("Add at least one subject!"); return;}
  // Rename or update
  delete subjectsByExam[oldExam];
  subjectsByExam[newExam] = JSON.parse(JSON.stringify(window.subjectRows));
  saveData(); closePopup();
  alert("Exam updated!");
}
function deleteExamConfirm(exam) {
  let html = `<div class="popup-bg" id="popup-bg">
    <div class="popup">
      <div style="margin-bottom:7px;">Are you sure you want to delete exam <b>${exam}</b>?</div>
      <div class="option-row">
        <button class="option-btn" onclick="closePopup()">Cancel</button>
        <button class="option-btn" style="background:#e74c3c;color:#fff;" onclick="deleteExamSecondConfirm('${exam.replace(/'/g,"\\'")}')">Delete</button>
      </div>
    </div>
  </div>`;
  showPopup(html);
}
function deleteExamSecondConfirm(exam) {
  let html = `<div class="popup-bg" id="popup-bg">
    <div class="popup">
      <div style="margin-bottom:7px;"><b>Confirm again</b> to delete exam <b>${exam}</b>!</div>
      <div class="option-row">
        <button class="option-btn" onclick="closePopup()">Cancel</button>
        <button class="option-btn" style="background:#e74c3c;color:#fff;" onclick="deleteExam('${exam.replace(/'/g,"\\'")}')">Delete</button>
      </div>
    </div>
  </div>`;
  showPopup(html);
}
function deleteExam(exam) {
  delete subjectsByExam[exam];
  saveData();
  closePopup();
  showExamSettingsPopup();
}
function enableExamLongPress() {
  // already set inline in showExamList
}
function addSubjectRow() {
  let name = document.getElementById('subjectName').value.trim();
  let max = document.getElementById('maxMarks').value.trim();
  if (!name || !max) return;
  window.subjectRows.push({name, max});
  updateSubjectsList();
  document.getElementById('subjectName').value = "";
  document.getElementById('maxMarks').value = "";
}
function updateSubjectsList() {
  let div = document.getElementById('subjects-list');
  if (!div) return;
  let html = "";
  (window.subjectRows||[]).forEach((row, idx)=>{
    html += `<div class="subject-item"><span class="subject-name">${row.name}</span>
    <span class="max-marks">(Max: ${row.max})</span>
    <button class="remove-subject" onclick="removeSubjectRow(${idx})"><i class="fa fa-times"></i></button></div>`;
  });
  div.innerHTML = html;
}
function removeSubjectRow(idx) {
  window.subjectRows.splice(idx,1);
  updateSubjectsList();
}
function addExamSetting(e) {
  e.preventDefault();
  let examName = e.target.examName.value.trim();
  if(!examName) return;
  if((window.subjectRows||[]).length<1) { alert("Add at least one subject!"); return;}
  subjectsByExam[examName] = JSON.parse(JSON.stringify(window.subjectRows));
  saveData(); closePopup();
  alert("Exam settings saved!");
}

// Enter Marks
function showEnterMarksPopup() {
  // Step 1: Section
  let secList = [];
  classes.forEach((cls,cidx)=>{
    cls.sections.forEach((sec,sidx)=>{
      secList.push({classIdx:cidx,secIdx:sidx,disp:`${cls.name} – ${sec.name}`});
    });
  });
  let html = `<div class="popup-bg" id="popup-bg">
  <div class="popup" style="max-width:370px;">
    <label>Select Section</label>
    <select id="enterSec" style="font-size:1.11em;">
      ${secList.map(s=>`<option value="${s.classIdx},${s.secIdx}">${s.disp}</option>`).join('')}
    </select>
    <label>Select Exam</label>
    <select id="enterExam" onchange="updateEnterMarksSubjects()" style="font-size:1.11em;">
      <option value="">Select</option>
      ${Object.keys(subjectsByExam).map(e=>`<option value="${e}">${e}</option>`).join('')}
    </select>
    <label>Select Subject</label>
    <select id="enterSubject" style="font-size:1.11em;"></select>
    <div class="btn-row" style="margin-top:11px;">
      <button type="button" class="cancel-btn" onclick="closePopup()">Cancel</button>
      <button onclick="enterMarksStart()">OK</button>
    </div>
  </div></div>`;
  showPopup(html);
}
function updateEnterMarksSubjects() {
  let examName = document.getElementById('enterExam').value;
  let subs = subjectsByExam[examName]||[];
  let sel = document.getElementById('enterSubject');
  sel.innerHTML = subs.map(s=>`<option value="${s.name}">${s.name} (Max: ${s.max})</option>`).join('');
}
function enterMarksStart() {
  let [classIdx, secIdx] = document.getElementById('enterSec').value.split(',');
  let examName = document.getElementById('enterExam').value;
  let subject = document.getElementById('enterSubject').value;
  if (!examName || !subject) return alert("Select exam and subject!");
  closePopup();
  let section = classes[classIdx].sections[secIdx];
  let students = [...section.students];
  students.sort((a,b)=>parseInt(a.roll)-parseInt(b.roll));
  let max = 0;
  (subjectsByExam[examName]||[]).forEach(s=>{if(s.name===subject) max=+s.max;});
  let html = `<div class="screen-title">${classes[classIdx].name} – ${section.name}<br>Exam: ${examName} | Subject: ${subject}</div>
  <form id="marksForm">
  <div class="student-list">`;
  students.forEach((stu,idx)=>{
    let obt = (stu.marks[examName]||{})[subject]||"";
    html += `<div class="student-row" style="padding:11px 0 11px 7px;">
    <span class="marks-entry-student">${stu.roll}.</span> <span class="marks-entry-student">${stu.name}</span>
    <input class="marks-entry-input" type="number" min="0" max="${max}" 
    name="mark${idx}" value="${obt}" oninput="autoSaveMark(${classIdx},${secIdx},${idx},'${examName}','${subject}',this)">
    </div>`;
  });
  html += `</div></form>`;
  document.getElementById("main-area").innerHTML = html;
  showFAB("←", ()=>showStudentList(classIdx,secIdx,false));
  showSettingsBtn(false);
  pushHistory("enterMarks",classIdx,secIdx);
}
function autoSaveMark(classIdx, secIdx, stuIdx, exam, subject, inp) {
  let val = inp.value.trim();
  let mark = val ? +val : "";
  let stu = classes[classIdx].sections[secIdx].students[stuIdx];
  if (!stu.marks) stu.marks = {};
  if (!stu.marks[exam]) stu.marks[exam] = {};
  stu.marks[exam][subject] = mark;
  saveData();
  inp.style.background = "#c6e6ce";
  setTimeout(()=>inp.style.background="",700);
}
// Download PDF (placeholder)
function showDownloadClassPDF() {
  alert("Download Class Marks Memo feature coming soon!");
}
// Popups
function closePopup() {
  if (lastPopup) lastPopup.remove();
  lastPopup = null;
}
function showPopup(html) {
  closePopup();
  let div = document.createElement('div');
  div.innerHTML = html;
  lastPopup = div.firstElementChild;
  document.body.appendChild(lastPopup);
}
// History and Mobile Back
function pushHistory(screen, ...params) {
  if(!firstLoad) historyStack.push({screen,params});
  firstLoad = false;
  window.history.pushState({screen,params}, "");
}
window.onpopstate = function(event) {
  let state = event.state;
  if(state && state.screen) {
    let {screen, params} = state;
    if(screen==="classList") showClassList(false);
    else if(screen==="sectionList") showSectionList(...params,false);
    else if(screen==="studentList") showStudentList(...params,false);
    else if(screen==="enterMarks") enterMarksStart(...params);
  } else {
    // if at start, stay at class list
    showClassList(false);
  }
};
// Initial load
loadData();
// showClassList() is now called after splash
