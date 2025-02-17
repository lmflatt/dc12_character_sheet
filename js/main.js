// GLOBAL VARIABLES

let classes = {};
let selectedClassData = {};
let skills = [];
let icons = [];
let selectedSkills = [];
let characterName = "";
const pageWidth = 215.9; // Letter page width in mm
const iconSize = 26.46; // 100px converted to mm
const shortRestRuleText = 'This ability maybe used 2 times. To regain your uses, your DM may decide you need a short rest, a snack, or just an end to the current combat.';
const longRestRuleText = 'This ability maybe used once. You need a long rest to regain it.';

const modal = document.getElementById("customClassModal");


// PREPARE DOM

document.addEventListener("DOMContentLoaded", async function() {
    console.log("DOM Loaded: Binding events now...");
    document.getElementById("savePdf").addEventListener("click", generatePDF);
    // document.getElementById("dropdown").addEventListener("change", selectClass);
    document.getElementById("imageInput").addEventListener("change", previewImage);
    document.getElementById("characterNameInput").addEventListener("input", updateCharacterName);

    await Promise.all([
        loadJSON("js/classes.json", classes),
        loadJSON("js/skills.json", skills),
        loadJSON("js/icons.json", icons)
    ]);

    const closeBtn = document.querySelector(".close");
    const submitBtn = document.getElementById("submitCustomClass");
    const dropdown = document.getElementById("dropdown");

    function populateIconDropdown(selectElement) {
        icons.forEach(icon => {
            let option = document.createElement("option");
            option.value = icon;
            option.textContent = icon;
            selectElement.appendChild(option);
        });
    }
    
    document.querySelectorAll(".attack-icon, #shortRestIcon, #longRestIcon").forEach(select => {
        populateIconDropdown(select);
        select.addEventListener("change", function() {
            this.nextElementSibling.src = this.value ? `icons/${this.value}.jpg` : "icons/default.jpg";
        });
    });

    dropdown.addEventListener("change", function() {
        if (dropdown.value === "custom") {
            modal.style.display = "block";
        }
        else {
            selectClass();
        }
    });
    
    closeBtn.addEventListener("click", function() {
        modal.style.display = "none";
    });
    
    window.addEventListener("click", function(event) {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    });

    submitBtn.addEventListener("click", createCustomClass);

    setupSkillCheckboxes();
    selectClass();
    generatePreview();
});

async function loadJSON(filePath, targetVariable) {
    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`Failed to load ${filePath}: ${response.statusText}`);
        }
        const data = await response.json();
        Object.assign(targetVariable, data); // Merge data into global variable
        console.log(`Loaded ${filePath}:`, data);
    } catch (error) {
        console.error(`Error loading ${filePath}:`, error);
    }
}


// DOM FUNCTIONS

function setupSkillCheckboxes() {
    const container = document.getElementById("skillsContainer");
    container.innerHTML = "";
    
    skills.forEach(skill => {
        let skillKey = skill.name.toLowerCase();  // Match key format
        let label = document.createElement("label");
        label.style.display = "flex";  // Align icon and text properly
        label.style.alignItems = "center";
        label.style.gap = "8px";  // Add spacing between icon and text

        let checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = skillKey;
        checkbox.classList.add("skill-checkbox");
        checkbox.addEventListener("change", enforceSkillSelection);
        
        let icon = document.createElement("img");
        icon.src = `icons/${skillKey}.jpg` || "icons/default.png"; // Use default if missing
        icon.alt = skillKey;
        icon.style.width = "40px";
        icon.style.height = "40px";

        let skillName = document.createElement("strong");
        skillName.textContent = `${skill.name}.`;
        let skillDescription = document.createElement("p");
        skillDescription.textContent = skill.desc;

        label.appendChild(checkbox);
        label.appendChild(icon);
        label.appendChild(skillName);
        label.appendChild(skillDescription);

        container.appendChild(label);
        container.appendChild(document.createElement("br"));
    });
}


function updateCharacterName() {
    characterName = document.getElementById("characterNameInput").value;
    generatePreview(); // Refresh PDF preview
}

function selectClass() {
    let dropdown = document.getElementById("dropdown");
    let selectedClass = dropdown.options[dropdown.selectedIndex].value;
    selectedClassData = classes[selectedClass];
    console.log(selectedClassData)
    let classSkill = selectedClassData.skill;
    
    document.querySelectorAll(".skill-checkbox").forEach(checkbox => {
        checkbox.checked = false;
        checkbox.disabled = false;
    });
    
    let classCheckbox = [...document.querySelectorAll(".skill-checkbox")].find(cb => cb.value === classSkill);
    if (classCheckbox) {
        classCheckbox.checked = true;
        classCheckbox.disabled = true;
    }

    const classDescriptionContainer = document.getElementById("classDescription");
    classDescriptionContainer.innerHTML = "";

    let label = document.createElement("label");
    label.style.display = "flex";  // Align icon and text properly
    label.style.alignItems = "center";
    label.style.gap = "8px";  // Add spacing between icon and text
    
    if (selectedClassData.name != "none")
    {
        let classImage = document.createElement("img");
        classImage.src = `images/${selectedClassData.name.toLowerCase()}.jpg` || "images/default.jpg"; // Use default if missing
        classImage.alt = selectedClassData.name;
        classImage.style.width = "160px";
        classImage.style.height = "160px";
        label.appendChild(classImage);
    }

    let classDescription = document.createElement("p");
    classDescription.textContent = selectedClassData.desc;
    classDescription.style.paddingLeft = "40px";
    label.appendChild(classDescription);   
    
    classDescriptionContainer.appendChild(label)
    // classDescriptionContainer.appendChild(document.createElement("br"));

    updateSelectedSkills();
    generatePreview();
}

function enforceSkillSelection() {
    let checkedBoxes = document.querySelectorAll(".skill-checkbox:checked");
    let totalChecked = checkedBoxes.length;
    
    if (totalChecked > 3) {
        this.checked = false;
    }

    updateSelectedSkills();
    generatePreview();
}

function updateSelectedSkills() {
    selectedSkills = [...document.querySelectorAll(".skill-checkbox:checked")].map(cb => ({
        icon: cb.value,
        desc: `${cb.value.charAt(0).toUpperCase()}${cb.value.slice(1)}`,
        value: "+1"
    }));
}


function previewImage(event) {
    const frame = document.getElementById("imageFrame");
    frame.innerHTML = ""; // Clear existing preview

    let file = event.target.files[0];
    if (file) {
        let reader = new FileReader();

        reader.onload = function (e) {
            let img = document.createElement("img");
            img.src = e.target.result; // Use base64 Data URL
            img.alt = "Uploaded Image";
            img.style.width = "100px"; // Adjust size as needed
            img.style.height = "auto";

            img.onload = function () { // Ensure image is fully loaded
                generatePreview(); 
            };

            frame.appendChild(img);
        };

        reader.readAsDataURL(file); // Convert to base64 Data URL
    }
}


function generatePreview() {
    const previewContainer = document.getElementById("previewContainer");
    previewContainer.innerHTML = '';

    let banner = document.createElement("label");
    banner.style.backgroundColor = `rgb(${selectedClassData.red}, ${selectedClassData.blue}, ${selectedClassData.green})`;
    banner.style.padding = "10px"; 
    banner.style.display = "flex";  // Align icon and text properly
    banner.style.alignItems = "center";
    banner.style.gap = "40px";  // Add spacing between icon and text

    let uploadedImg = document.querySelector("#imageFrame img");

    let previewImg = document.createElement("img");
    previewImg.style.width = "auto";
    previewImg.style.height = "120px";

    if (uploadedImg) {
        previewImg.src = uploadedImg.src;
    }
    else if (selectedClassData.name != "none") {
        previewImg.src = `images/${selectedClassData.name.toLowerCase()}.jpg`;
    }

    banner.appendChild(previewImg);

    let characterNameField = document.createElement("span");
    characterNameField.style.fontSize = "32px"
    characterNameField.textContent = characterName + (selectedClassData.name != "none" ? ` - ${selectedClassData.name}` : "");

    banner.appendChild(characterNameField);

    previewContainer.appendChild(banner);

    if (selectedClassData.name != "none") {
        previewContainer.appendChild(document.createElement("br"));
        previewContainer.appendChild(createIconStatDisplay(selectedClassData.attributes));
        previewContainer.appendChild(document.createElement("br"));
        previewContainer.appendChild(document.createElement("hr"));
    }

    if (selectedSkills.length) {
        previewContainer.appendChild(document.createElement("br"));
        previewContainer.appendChild(createIconStatDisplay(selectedSkills));
    }
    
    if (selectedClassData.attacks.length) {
        previewContainer.appendChild(document.createElement("br"));
        previewContainer.appendChild(document.createElement("hr"));
        previewContainer.appendChild(document.createElement("br"));
        previewContainer.appendChild(createIconStatDisplay(selectedClassData.attacks));
    }

    if (selectedClassData.shortRestAbility != "") {
        let shortRestRule = document.createElement('p');
        shortRestRule.textContent = shortRestRuleText;
        shortRestRule.style.textAlign = 'center';
        shortRestRule.style.fontSize = '16px';
        shortRestRule.style.fontWeight = 'bold';
        shortRestRule.style.color = 'gray';

        let shortRestBar = document.createElement("label");
        shortRestBar.style.display = "flex";  // Align icon and text properly
        shortRestBar.style.alignItems = "center";
        shortRestBar.style.gap = "40px";  // Add spacing between icon and text

        let shortRestIcon1 = document.createElement("img");
        shortRestIcon1.style.width = "100px"; // Adjust size if needed
        shortRestIcon1.style.height = "auto";
        shortRestIcon1.src = `icons/${selectedClassData.shortRestIcon}.jpg`;
        let shortRestIcon2 = shortRestIcon1.cloneNode();
        let shortRestDescription = document.createElement("span");
        shortRestDescription.style.fontSize = "16px"
        shortRestDescription.textContent = selectedClassData.shortRestAbility;

        shortRestBar.appendChild(shortRestIcon1);
        shortRestBar.appendChild(shortRestIcon2);
        shortRestBar.appendChild(shortRestDescription);

        previewContainer.appendChild(document.createElement("br"));
        previewContainer.appendChild(document.createElement("hr"));
        previewContainer.appendChild(document.createElement("br"));
        previewContainer.appendChild(shortRestRule);
        previewContainer.appendChild(shortRestBar);
    }


    if (selectedClassData.longRestAbility != "") {
        let longRestRule = document.createElement('p');
        longRestRule.textContent = longRestRuleText;
        longRestRule.style.textAlign = 'center';
        longRestRule.style.fontSize = '16px';
        longRestRule.style.fontWeight = 'bold';
        longRestRule.style.color = 'gray';

        let longRestBar = document.createElement("label");
        longRestBar.style.display = "flex";  // Align icon and text properly
        longRestBar.style.alignItems = "center";
        longRestBar.style.gap = "40px";  // Add spacing between icon and text

        let longRestIcon = document.createElement("img");
        longRestIcon.style.width = "100px"; // Adjust size if needed
        longRestIcon.style.height = "auto";
        longRestIcon.src = `icons/${selectedClassData.longRestIcon}.jpg`;
        let longRestDescription = document.createElement("span");
        longRestDescription.style.fontSize = "16px"
        longRestDescription.textContent = selectedClassData.longRestAbility;

        longRestBar.appendChild(longRestIcon);
        longRestBar.appendChild(longRestDescription);

        previewContainer.appendChild(document.createElement("br"));
        previewContainer.appendChild(document.createElement("hr"));
        previewContainer.appendChild(document.createElement("br"));
        previewContainer.appendChild(longRestRule);
        previewContainer.appendChild(longRestBar);
    }
}

function createIconStatDisplay(statsArray) {
    let container = document.createElement("div");
    container.style.display = "flex";
    container.style.justifyContent = "space-around"; // Even spacing
    container.style.alignItems = "center";
    container.style.width = "100%";

    statsArray.forEach(stat => {
        let statWrapper = document.createElement("div");
        statWrapper.style.display = "flex";
        statWrapper.style.flexDirection = "column";
        statWrapper.style.alignItems = "center";
        statWrapper.style.position = "relative";

        // Create a flex row for the icon and number
        let iconRow = document.createElement("div");
        iconRow.style.display = "flex";
        iconRow.style.alignItems = "center";
        iconRow.style.gap = "8px"; // Space between icon and number

        // Icon
        let icon = document.createElement("img");
        icon.src = `icons/${stat.icon}.jpg`;
        icon.alt = stat.label;
        icon.style.width = "100px"; // Adjust size as needed
        icon.style.height = "100px";
        iconRow.appendChild(icon);

        // Large Number
        if (stat.value) {
            let number = document.createElement("span");
            number.textContent = stat.value;
            number.style.fontSize = typeof stat.value === 'string' ? "40px" : "80px";
            number.style.fontWeight = "bold";
            iconRow.appendChild(number);
        }

        statWrapper.appendChild(iconRow);

        // Small text label below
        if (stat.desc) {
            let label = document.createElement("span");
            label.textContent = stat.desc;
            label.style.fontSize = "16px"; // Small text
            statWrapper.appendChild(label);
        }

        // Append elements
        container.appendChild(statWrapper);
    });

    return container;
}


// EXPORT PDF

function generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFillColor(selectedClassData.red, selectedClassData.blue, selectedClassData.green);
    doc.rect(0, 0, 210, 30, 'F');

    let uploadedImg = document.querySelector("#imageFrame img");
    let previewImg = document.createElement("img");
    let yPosition = 5

    if (uploadedImg) {
        previewImg.src = uploadedImg.src;
    }
    else if (selectedClassData.name != "none") {
        previewImg.src = `images/${selectedClassData.name.toLowerCase()}.jpg`;
    }
    
    if (previewImg) {
        let canvas = document.createElement('canvas');
        let ctx = canvas.getContext('2d');
        canvas.width = previewImg.naturalWidth;
        canvas.height = previewImg.naturalHeight;
        ctx.drawImage(previewImg, 0, 0);

        // Get the natural width and height of the image
        let aspectRatio = previewImg.naturalWidth / previewImg.naturalHeight;

        // Set the desired height and calculate width based on the aspect ratio
        let fixedHeight = 20; // Desired fixed height
        let scaledWidth = fixedHeight * aspectRatio;
        
        let imgData = canvas.toDataURL('image/jpeg');
        doc.addImage(imgData, 'JPEG', 10, yPosition, scaledWidth, fixedHeight);
    }
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(characterName + (selectedClassData.name != "none" ? ` - ${selectedClassData.name}` : ""), 40, 15);

    // Class attributes: HP, AC, Speed
    yPosition += 40;
    drawIcons(doc, selectedClassData.attributes, yPosition)

    yPosition += 40;
    doc.setLineWidth(0.5);
    doc.line(10, yPosition, 200, yPosition);

    // Skills
    yPosition += 10;
    drawIcons(doc, selectedSkills, yPosition)
    
    yPosition += 40;
    doc.line(10, yPosition, 200, yPosition);

    // Attacks
    yPosition += 10;
    drawIcons(doc, selectedClassData.attacks, yPosition)

    yPosition += 40;
    doc.line(10, yPosition, 200, yPosition);

    // Abilities
    yPosition += 10;
    doc.addImage(`icons/${selectedClassData.shortRestIcon}.jpg`, "JPEG", 12, yPosition, iconSize, iconSize);
    doc.addImage(`icons/${selectedClassData.shortRestIcon}.jpg`, "JPEG", 12 + iconSize, yPosition, iconSize, iconSize);

    doc.setFontSize(10);
    doc.setTextColor("silver");
    doc.text(shortRestRuleText, 16 + (iconSize * 2), yPosition, { maxWidth: (pageWidth - 32 - (iconSize * 2)) });

    doc.setFontSize(12);
    doc.setTextColor("black");
    doc.text(selectedClassData.shortRestAbility, 16 + (iconSize * 2), yPosition + 2 + (iconSize / 2), { maxWidth: (pageWidth - 32 - (iconSize * 2)) });

    yPosition += 40;
    doc.line(10, yPosition, 200, yPosition);

    yPosition += 10;
    doc.addImage(`icons/${selectedClassData.longRestIcon}.jpg`, "JPEG", 16, yPosition, iconSize, iconSize);

    doc.setFontSize(10);
    doc.setTextColor("silver");
    doc.text(longRestRuleText, 28 + iconSize, yPosition, { maxWidth: (pageWidth - 40 - iconSize) });

    doc.setFontSize(12);
    doc.setTextColor("black");
    doc.text(selectedClassData.longRestAbility, 28 + iconSize, yPosition + (iconSize / 2), { maxWidth: (pageWidth - 40 - iconSize) });

    let fileName = characterName ? characterName.replace(" ","_") + "_character_sheet.pdf" : "character_sheet.pdf";
    doc.save(fileName);
}

function drawIcons(doc, iconData, yPosition) {
    const textOffset = 5; // Space between icon and number
    doc.setFontSize(32);
    let valueWidth = doc.getTextWidth("+1");
    // const descOffset = 5; // Space between icon/number and description text

    let unitWidth = iconSize + (iconData[0].value ? valueWidth : 0); // Total space per unit (icon + optional text)
    let xPositions = [];

    // Determine X positions based on the number of units
    if (iconData.length === 1) {
        xPositions = [(pageWidth - unitWidth) / 2]; // Centered
    } else if (iconData.length === 2) {
        xPositions = [
            (pageWidth / 3) - (unitWidth / 2),
            (2 * pageWidth / 3) - (unitWidth / 2)
        ];
    } else if (iconData.length === 3) {
        xPositions = [
            (pageWidth / 4) - (unitWidth * .75),
            (pageWidth / 2) - (unitWidth / 2),
            (3 * pageWidth / 4) - (unitWidth / 4)
        ];
    }

    // Draw each icon-number pair
    iconData.forEach((data, index) => {
        let x = xPositions[index];

        if (data.icon === "hp") {
            x -= 10;
        }

        // Draw icon
        doc.addImage(`icons/${data.icon}.jpg`, "JPEG", x, yPosition, iconSize, iconSize);

        // Draw value only if it exists
        let currentY = yPosition + (iconSize/2) + textOffset;
        if (data.value) {
            // Adjust font size as needed
            doc.setFontSize(32);
            let text = `${data.value}`;
            let xCoord = x + iconSize;

            if (data.icon === "hp") {
                let rectangleSize = 16;
                doc.rect(xCoord, currentY - 12, rectangleSize, rectangleSize);
                text = "/" + text;
                xCoord += rectangleSize + 1;
            }

            doc.text(text, xCoord, currentY);
            currentY += (iconSize/2); // Adjust Y for next element (description)
        } 

        // Draw description under the icon if present (number or not)
        if (data.desc) {
            doc.setFontSize(12); // Font size for description
            let xUnitWidth = data.value ? iconSize * 1.8 : iconSize;
            let xTextWidth = doc.getTextWidth(data.desc);
            let xTextOffset = (xUnitWidth - xTextWidth)/2;
            if (data.icon === "hp") {
                xTextOffset += 10;
            }

            doc.text(`${data.desc}`, x + xTextOffset, currentY);
        }
    });
}


// CUSTOM CLASS GENERATOR
function createCustomClass() {
    const className = document.getElementById("customClassName").value.trim();
    const hp = document.getElementById("hp").value;
    const ac = document.getElementById("ac").value;
    const speed = document.getElementById("speed").value;
    const attackIcons = document.querySelectorAll(".attack-icon");
    const attackDescs = document.querySelectorAll(".attack-desc");
    const shortRestIcon = document.getElementById("shortRestIcon").value;
    const shortRestDesc = document.getElementById("shortRestDesc").value.trim();
    const longRestIcon = document.getElementById("longRestIcon").value;
    const longRestDesc = document.getElementById("longRestDesc").value.trim();
    
    if (!className || !hp || !ac || !speed || !shortRestDesc || !longRestDesc) {
        alert("Please fill out all required fields.");
        return;
    }
    
    let attacks = [];
    attackIcons.forEach((icon, index) => {
        const desc = attackDescs[index].value.trim();
        if (desc) {
            attacks.push({ icon: icon.value, value: "+1", desc });
        }
    });
    
    if (attacks.length < 1) {
        alert("At least one attack is required.");
        return;
    }
    
    selectedClassData = {
        name: className,
        attributes: [
            { icon: "hp", desc: "Hit Points", value: hp },
            { icon: "ac", desc: "Armor Class", value: ac },
            { icon: "speed", desc: "Speed", value: speed }
        ],
        attacks,
        shortRestIcon,
        shortRestAbility: shortRestDesc,
        longRestIcon,
        longRestAbility: longRestDesc,
        red: 200,
        blue: 200,
        green: 200
    };
    console.log("Custom Class Saved:", selectedClassData);
    modal.style.display = "none";

    generatePreview();
}