const fs = require('fs');
let content = fs.readFileSync('src/components/use-case/SingleAssessmentPageComponent/Assessments/CoreArea3_Zakat/CRITERIA_OPTION_TEXT.ts', 'utf8');

// Replace P1.x with S2.x
content = content.replace(/"P1\.(\d+)":/g, '"S2.$1":');
// Replace E1.x with S3.x
content = content.replace(/"E1\.(\d+)":/g, '"S3.$1":');
// Replace T1.x with S4.x
content = content.replace(/"T1\.(\d+)":/g, '"S4.$1":');
// Replace C1.x with S5.x
content = content.replace(/"C1\.(\d+)":/g, '"S5.$1":');

fs.writeFileSync('src/components/use-case/SingleAssessmentPageComponent/Assessments/CoreArea3_Zakat/CRITERIA_OPTION_TEXT.ts', content);
