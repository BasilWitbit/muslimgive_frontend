import re

with open('src/components/use-case/SingleAssessmentPageComponent/Assessments/CoreArea3_Zakat/CRITERIA_OPTION_TEXT.ts', 'r') as f:
    content = f.read()

content = re.sub(r'"P1\.(\d+)":', r'"S2.\1":', content)
content = re.sub(r'"E1\.(\d+)":', r'"S3.\1":', content)
content = re.sub(r'"T1\.(\d+)":', r'"S4.\1":', content)
content = re.sub(r'"C1\.(\d+)":', r'"S5.\1":', content)

with open('src/components/use-case/SingleAssessmentPageComponent/Assessments/CoreArea3_Zakat/CRITERIA_OPTION_TEXT.ts', 'w') as f:
    f.write(content)
