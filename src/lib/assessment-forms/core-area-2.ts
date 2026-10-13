import { FormDefinition } from './types';

export const CORE_AREA_2_FORMS: FormDefinition[] = [
    {
        "id": "353cb6ae-503e-4fca-b5d3-8bf34288dd87",
        "title": "Financial Assessment (UK)",
        "version": 1,
        "countryCode": "united-kingdom",
        "scoreLogic": null,
        "rubric": {
            "id": "26efbc71-0d5a-4594-864e-7a0b4f43d947",
            "gradeThresholds": {},
            "isActive": true,
            "version": 1
        },
        "questions": [
            {
                "id": "0235e03a-eb46-4654-840d-a6770d8d099a",
                "code": "F01",
                "fieldKey": "audited_financial_statements_available_on_website",
                "label": "Audited financial statements available on website?",
                "type": "radio",
                "required": true,
                "scoreLogic": null,
                "options": [
                    {
                        "id": "8e61b05e-8c33-43d6-a6ab-9e2d5094f343",
                        "label": "Yes",
                        "sortOrder": 0
                    },
                    {
                        "id": "746935ee-f8c7-4516-939e-b4aa616f09b9",
                        "label": "No",
                        "sortOrder": 1
                    }
                ],
                "rubricItem": {
                    "id": "7c7ddf34-e037-4476-ad31-c928db9cdf2f",
                    "weight": "1",
                    "maxScore": "4",
                    "exclusion": false,
                    "criteria": []
                }
            },
            {
                "id": "70793b2c-1cbd-45c6-b1e8-a10e4afa7b17",
                "code": "F02",
                "fieldKey": "previous_year_audited_financial_statements_available_on_website",
                "label": "Previous year audited financial statements available on website?",
                "type": "radio",
                "required": true,
                "scoreLogic": null,
                "options": [
                    {
                        "id": "19b4fd56-7eec-4414-ae29-e48a426769b4",
                        "label": "Yes",
                        "sortOrder": 0
                    },
                    {
                        "id": "7fa59a11-83a5-4760-9dd8-94ee5b52f74c",
                        "label": "No",
                        "sortOrder": 1
                    }
                ],
                "rubricItem": {
                    "id": "073ca398-1ce3-4ed4-a8c5-afc179fddfec",
                    "weight": "1",
                    "maxScore": "1",
                    "exclusion": false,
                    "criteria": []
                }
            },
            {
                "id": "3d43cab9-c535-4433-a0a8-495f1cb01aa4",
                "code": "F03",
                "fieldKey": "impact_report_with_financial_information_available_on_website",
                "label": "Impact report with financial information available on website?",
                "type": "radio",
                "required": true,
                "scoreLogic": null,
                "options": [
                    {
                        "id": "179f3122-1db8-428e-9bb8-046679d2e9f5",
                        "label": "Yes",
                        "sortOrder": 0
                    },
                    {
                        "id": "a3677398-9bcb-4ce5-bcc5-47b65771ba7e",
                        "label": "No",
                        "sortOrder": 1
                    }
                ],
                "rubricItem": {
                    "id": "69b2b3f6-743b-437e-bdd8-a739928ae6a8",
                    "weight": "1",
                    "maxScore": "1",
                    "exclusion": false,
                    "criteria": []
                }
            },
{
                "id": "ece6f9ec-a588-437d-8374-a2d1d5cd1587",
                "code": "F16",
                "fieldKey": "total_revenue",
                "label": "Total Revenue",
                "type": "number",
                "required": true,
                "scoreLogic": null,
                "options": [],
                "rubricItem": null
            },
            {
                "id": "bdb315cc-4459-497b-8929-0b288614d023",
                "code": "F04",
                "fieldKey": "percentage_of_total_revenue_spent_on_charitable_programs_and_qualified_distributions_0_100",
                "label": "Percentage of total revenue spent on charitable programs and qualified distributions (0-100%)",
                "type": "number",
                "required": true,
                "scoreLogic": "if value>=90 then 6 elif value>=80 then 4.5 elif value>=70 then 3 elif value>=60 then 1.5 else 0",
                "options": [],
                "rubricItem": {
                    "id": "cf80e12e-b98e-4209-89b3-669b224f97fa",
                    "weight": "1",
                    "maxScore": "0",
                    "exclusion": false,
                    "criteria": []
                }
            },
            {
                "id": "1b621d99-511b-4a0b-ba38-ed5d020a7425",
                "code": "F05",
                "fieldKey": "percentage_of_total_revenue_spent_on_fundraising_0_100",
                "label": "Percentage of total revenue spent on fundraising (0-100%)",
                "type": "number",
                "required": true,
                "scoreLogic": "if value<=10 then 6 elif value<=15 then 4.5 elif value<=20 then 3 elif value<=25 then 1.5 else 0",
                "options": [],
                "rubricItem": {
                    "id": "88f4a677-e032-4cec-b3c0-fcb30ad6556c",
                    "weight": "1",
                    "maxScore": "0",
                    "exclusion": false,
                    "criteria": []
                }
            },
            {
                "id": "abae8c30-0bf7-47ae-8f6e-7c8c85d05b0d",
                "code": "F06",
                "fieldKey": "percentage_of_total_revenue_spent_on_administrative_expenses_0_100",
                "label": "Percentage of total revenue spent on administrative expenses (0-100%)",
                "type": "number",
                "required": true,
                "scoreLogic": "if value<=5 then 6 elif value<=10 then 4.5 elif value<=15 then 3 elif value<=20 then 1.5 else 0",
                "options": [],
                "rubricItem": {
                    "id": "e357e966-9745-40de-b148-9232e72b9517",
                    "weight": "1",
                    "maxScore": "0",
                    "exclusion": false,
                    "criteria": []
                }
            },
{
                "id": "26e8a749-4a9b-4269-83e3-8a7c9f298153",
                "code": "F17",
                "fieldKey": "percentage_of_total_revenue_spent_on_compensation_0_100",
                "label": "Compensation %",
                "type": "number",
                "required": true,
                "scoreLogic": null,
                "options": [],
                "rubricItem": null
            },
            {
                "id": "f19a1000-aaaa-4bbb-8ccc-000000000001",
                "code": "F19",
                "fieldKey": "qd_percent",
                "label": "QD Spend %",
                "type": "number",
                "required": false,
                "scoreLogic": null,
                "options": [],
                "rubricItem": null
            },
            {
                "id": "26ecba55-05a3-4ee5-b677-00bfb7fa65e6",
                "code": "F07",
                "fieldKey": "percentage_of_revenue_spent_per_year_spent_revenue",
                "label": "Percentage of revenue spent per year (spent / revenue)",
                "type": "number",
                "required": true,
                "scoreLogic": "if value>=100 then 3 elif value>=66.67 then 2.25 elif value>=50 then 1.5 elif value>=33.3 then 0.75 else 0",
                "options": [],
                "rubricItem": {
                    "id": "401fe98b-b592-4c7e-ae2e-7cd5c98c7cdb",
                    "weight": "1",
                    "maxScore": "0",
                    "exclusion": false,
                    "criteria": []
                }
            },
{
                "id": "c1c89e40-6adf-4ee1-a42e-15b44571aa41",
                "code": "F18",
                "fieldKey": "reserves_in_months",
                "label": "Reserves (months)",
                "type": "number",
                "required": true,
                "scoreLogic": null,
                "options": [],
                "rubricItem": null
            },
                                                {
                "id": "4616f694-a7cd-449c-964d-2810febb222e",
                "code": "F08",
                "fieldKey": "financials_link",
                "label": "Financials (Link)",
                "type": "text",
                "required": true,
                "scoreLogic": null,
                "options": [],
                "rubricItem": null
            },
            {
                "id": "e5ff773b-7185-480c-a76c-3e23ae75445b",
                "code": "F09",
                "fieldKey": "tax_return_link",
                "label": "Tax Return (Link)",
                "type": "text",
                "required": true,
                "scoreLogic": null,
                "options": [],
                "rubricItem": null
            },
            {
                "id": "234d0804-71d2-491f-b40c-cae3fd469ce9",
                "code": "F12",
                "fieldKey": "end_of_fiscal_year",
                "label": "End of fiscal year",
                "type": "date",
                "required": true,
                "scoreLogic": null,
                "options": [],
                "rubricItem": null
            },
            {
                "id": "038a94c2-7586-4660-8548-512496da110e",
                "code": "F13",
                "fieldKey": "charitable_registration_since",
                "label": "Charitable Registration since",
                "type": "date",
                "required": false,
                "scoreLogic": null,
                "options": [],
                "rubricItem": null
            },
            {
                "id": "a69eaf7f-77f1-4c58-b339-ef3c6e7f7025",
                "code": "F15",
                "fieldKey": "notes",
                "label": "Notes",
                "type": "paragraph",
                "required": false,
                "scoreLogic": null,
                "options": [],
                "rubricItem": null
            }
        ]
    },
    {
        "id": "5289d778-2e2a-42be-8e96-2492b7085e8a",
        "title": "Financial Assessment (US)",
        "version": 1,
        "countryCode": "united-states",
        "scoreLogic": null,
        "rubric": {
            "id": "060db26c-bf8d-47f9-99aa-b80e64ba5f63",
            "gradeThresholds": {},
            "isActive": true,
            "version": 1
        },
        "questions": [
            {
                "id": "cac182df-9d4a-460b-97ce-78f0468f6de8",
                "code": "F01",
                "fieldKey": "audited_financial_statements_available_on_website",
                "label": "Audited financial statements available on website?",
                "type": "radio",
                "required": true,
                "scoreLogic": null,
                "options": [
                    {
                        "id": "74574a30-287c-4db0-a503-ba3cba65ad83",
                        "label": "Yes",
                        "sortOrder": 0
                    },
                    {
                        "id": "0e85b960-ba2c-4ffd-a512-649faa2acfbc",
                        "label": "No",
                        "sortOrder": 1
                    }
                ],
                "rubricItem": {
                    "id": "5b3513db-53e2-43ae-8b62-25829069bd39",
                    "weight": "1",
                    "maxScore": "4",
                    "exclusion": false,
                    "criteria": []
                }
            },
            {
                "id": "af4d3b3d-f191-40f4-bfb7-63058d9d6ee2",
                "code": "F02",
                "fieldKey": "previous_year_audited_financial_statements_available_on_website",
                "label": "Previous year audited financial statements available on website?",
                "type": "radio",
                "required": true,
                "scoreLogic": null,
                "options": [
                    {
                        "id": "bf15f2e7-d207-44e6-a3d8-eb92e2edbfb3",
                        "label": "Yes",
                        "sortOrder": 0
                    },
                    {
                        "id": "f0ac3cab-104f-4edd-98ee-04f42b2c1dbc",
                        "label": "No",
                        "sortOrder": 1
                    }
                ],
                "rubricItem": {
                    "id": "01997c2c-9768-4b5f-b6f8-489dc6e7e766",
                    "weight": "1",
                    "maxScore": "1",
                    "exclusion": false,
                    "criteria": []
                }
            },
            {
                "id": "71fbebc4-5c59-48b2-b125-fc99fcb2c2da",
                "code": "F03",
                "fieldKey": "impact_report_with_financial_information_available_on_website",
                "label": "Impact report with financial information available on website?",
                "type": "radio",
                "required": true,
                "scoreLogic": null,
                "options": [
                    {
                        "id": "40bc1cb1-d5d0-4757-9e89-bb73eec398f8",
                        "label": "Yes",
                        "sortOrder": 0
                    },
                    {
                        "id": "e97d2f1c-cf7f-42eb-88e3-dbf376772f8e",
                        "label": "No",
                        "sortOrder": 1
                    }
                ],
                "rubricItem": {
                    "id": "a267dc4d-ee4c-4d89-badf-9c857107452f",
                    "weight": "1",
                    "maxScore": "1",
                    "exclusion": false,
                    "criteria": []
                }
            },
{
                "id": "f9bea6da-677f-4b9e-a8ed-adb3d705fa57",
                "code": "F16",
                "fieldKey": "total_revenue",
                "label": "Total Revenue",
                "type": "number",
                "required": true,
                "scoreLogic": null,
                "options": [],
                "rubricItem": null
            },
            {
                "id": "6acdde17-0cd9-4056-a2b1-4aad7c08437a",
                "code": "F04",
                "fieldKey": "percentage_of_total_revenue_spent_on_charitable_programs_and_qualified_distributions_0_100",
                "label": "Percentage of total revenue spent on charitable programs and qualified distributions (0-100%)",
                "type": "number",
                "required": true,
                "scoreLogic": "if value>=90 then 6 elif value>=80 then 4.5 elif value>=70 then 3 elif value>=60 then 1.5 else 0",
                "options": [],
                "rubricItem": {
                    "id": "310ec884-8fd8-47a1-bf21-8266cb13d82a",
                    "weight": "1",
                    "maxScore": "0",
                    "exclusion": false,
                    "criteria": []
                }
            },
            {
                "id": "6dda97b3-d2d2-4219-8290-22ec86c065c0",
                "code": "F05",
                "fieldKey": "percentage_of_total_revenue_spent_on_fundraising_0_100",
                "label": "Percentage of total revenue spent on fundraising (0-100%)",
                "type": "number",
                "required": true,
                "scoreLogic": "if value<=10 then 6 elif value<=15 then 4.5 elif value<=20 then 3 elif value<=25 then 1.5 else 0",
                "options": [],
                "rubricItem": {
                    "id": "e2f1afea-8cfa-45af-9db3-0d879520bf5d",
                    "weight": "1",
                    "maxScore": "0",
                    "exclusion": false,
                    "criteria": []
                }
            },
            {
                "id": "42e5824d-f4a5-4927-83cb-6c0083ef85be",
                "code": "F06",
                "fieldKey": "percentage_of_total_revenue_spent_on_administrative_expenses_0_100",
                "label": "Percentage of total revenue spent on administrative expenses (0-100%)",
                "type": "number",
                "required": true,
                "scoreLogic": "if value<=5 then 6 elif value<=10 then 4.5 elif value<=15 then 3 elif value<=20 then 1.5 else 0",
                "options": [],
                "rubricItem": {
                    "id": "3875e66d-def4-4c31-8cea-9ec707210ae7",
                    "weight": "1",
                    "maxScore": "0",
                    "exclusion": false,
                    "criteria": []
                }
            },
{
                "id": "2bae3b4d-0c4f-4c92-90bf-8e0eb241cb47",
                "code": "F17",
                "fieldKey": "percentage_of_total_revenue_spent_on_compensation_0_100",
                "label": "Compensation %",
                "type": "number",
                "required": true,
                "scoreLogic": null,
                "options": [],
                "rubricItem": null
            },
            {
                "id": "f19a1000-aaaa-4bbb-8ccc-000000000002",
                "code": "F19",
                "fieldKey": "qd_percent",
                "label": "QD Spend %",
                "type": "number",
                "required": false,
                "scoreLogic": null,
                "options": [],
                "rubricItem": null
            },
            {
                "id": "bf3201c1-02d4-4504-8728-da87aa325d4c",
                "code": "F07",
                "fieldKey": "percentage_of_revenue_spent_per_year_spent_revenue",
                "label": "Percentage of revenue spent per year (spent / revenue)",
                "type": "number",
                "required": true,
                "scoreLogic": "if value>=100 then 3 elif value>=66.67 then 2.25 elif value>=50 then 1.5 elif value>=33.3 then 0.75 else 0",
                "options": [],
                "rubricItem": {
                    "id": "645a2e68-5c92-4882-aad4-f5c66d233bb1",
                    "weight": "1",
                    "maxScore": "0",
                    "exclusion": false,
                    "criteria": []
                }
            },
{
                "id": "7909fa8c-3e82-40c1-bca6-b44ad721e39c",
                "code": "F18",
                "fieldKey": "reserves_in_months",
                "label": "Reserves (months)",
                "type": "number",
                "required": true,
                "scoreLogic": null,
                "options": [],
                "rubricItem": null
            },
                                                {
                "id": "c0fb63ef-d0a5-4381-8090-2bac2d7e8c37",
                "code": "F08",
                "fieldKey": "financials_link",
                "label": "Financials (Link)",
                "type": "text",
                "required": true,
                "scoreLogic": null,
                "options": [],
                "rubricItem": null
            },
            {
                "id": "744fc6ce-0ca5-44ef-8f5a-616fe70c823a",
                "code": "F10",
                "fieldKey": "irs_returns_link",
                "label": "IRS Returns (Link)",
                "type": "text",
                "required": true,
                "scoreLogic": null,
                "options": [],
                "rubricItem": null
            },
            {
                "id": "5ae5538f-ec28-45b3-ae4f-33e309858a43",
                "code": "F12",
                "fieldKey": "end_of_fiscal_year",
                "label": "End of fiscal year",
                "type": "date",
                "required": true,
                "scoreLogic": null,
                "options": [],
                "rubricItem": null
            },
            {
                "id": "1b34a6b1-55fe-4b55-9a89-7c295c8d6f48",
                "code": "F13",
                "fieldKey": "charitable_registration_since",
                "label": "Charitable Registration since",
                "type": "date",
                "required": false,
                "scoreLogic": null,
                "options": [],
                "rubricItem": null
            },
            {
                "id": "02c1f08f-c271-4d5e-a943-a0d35ad436bc",
                "code": "F14",
                "fieldKey": "analysis_reviewed_date",
                "label": "Analysis Reviewed Date",
                "type": "date",
                "required": false,
                "scoreLogic": null,
                "options": [],
                "rubricItem": null
            },
            {
                "id": "aa09b2a4-cdb6-4192-8496-af3a16302211",
                "code": "F15",
                "fieldKey": "notes",
                "label": "Notes",
                "type": "paragraph",
                "required": false,
                "scoreLogic": null,
                "options": [],
                "rubricItem": null
            }
        ]
    },
    {
        "id": "2aa094b4-5683-4e72-a73e-aaa6d71485a4",
        "title": "Financial Assessment (CANADA)",
        "version": 1,
        "countryCode": "canada",
        "scoreLogic": null,
        "rubric": {
            "id": "b261edd0-b07b-42ec-9c95-f3507e67d924",
            "gradeThresholds": {},
            "isActive": true,
            "version": 1
        },
        "questions": [
            {
                "id": "d1399682-8f50-4d58-b767-6d8237aa3e17",
                "code": "F01",
                "fieldKey": "audited_financial_statements_available_on_website",
                "label": "Audited financial statements available on website?",
                "type": "radio",
                "required": true,
                "scoreLogic": null,
                "options": [
                    {
                        "id": "4a3c78a8-1f95-4686-a43f-81ca8e53de43",
                        "label": "Yes",
                        "sortOrder": 0
                    },
                    {
                        "id": "234c71db-b1d3-4e84-ad5e-6ad524dda17a",
                        "label": "No",
                        "sortOrder": 1
                    }
                ],
                "rubricItem": {
                    "id": "8a387bba-0332-475e-a993-9e8e89b1e4e9",
                    "weight": "1",
                    "maxScore": "4",
                    "exclusion": false,
                    "criteria": []
                }
            },
            {
                "id": "49c3108e-5465-4c54-bbed-db883efa7578",
                "code": "F02",
                "fieldKey": "previous_year_audited_financial_statements_available_on_website",
                "label": "Previous year audited financial statements available on website?",
                "type": "radio",
                "required": true,
                "scoreLogic": null,
                "options": [
                    {
                        "id": "965a0abf-c290-4c52-8bae-4d8a77a68c3a",
                        "label": "Yes",
                        "sortOrder": 0
                    },
                    {
                        "id": "ca488b8f-d193-4f36-98b7-ffb92850a97e",
                        "label": "No",
                        "sortOrder": 1
                    }
                ],
                "rubricItem": {
                    "id": "ed7b208d-f528-4729-9199-41a9e054beed",
                    "weight": "1",
                    "maxScore": "1",
                    "exclusion": false,
                    "criteria": []
                }
            },
            {
                "id": "16f5fdae-3b27-4ff1-a9dd-623821969855",
                "code": "F03",
                "fieldKey": "impact_report_with_financial_information_available_on_website",
                "label": "Impact report with financial information available on website?",
                "type": "radio",
                "required": true,
                "scoreLogic": null,
                "options": [
                    {
                        "id": "b4233f4c-0cf8-4eb1-891a-5abd669f4c1f",
                        "label": "Yes",
                        "sortOrder": 0
                    },
                    {
                        "id": "f6f7adfc-3419-47c3-9f06-864ffff0a40c",
                        "label": "No",
                        "sortOrder": 1
                    }
                ],
                "rubricItem": {
                    "id": "fe89722e-f44d-49d6-9339-e25c5efdeb82",
                    "weight": "1",
                    "maxScore": "1",
                    "exclusion": false,
                    "criteria": []
                }
            },
{
                "id": "f00f167a-c5cd-4295-b5b4-6e75b48c65dc",
                "code": "F16",
                "fieldKey": "total_revenue",
                "label": "Total Revenue",
                "type": "number",
                "required": true,
                "scoreLogic": null,
                "options": [],
                "rubricItem": null
            },
            {
                "id": "fd758732-4c14-43a6-91b4-5772f8f3de38",
                "code": "F04",
                "fieldKey": "percentage_of_total_revenue_spent_on_charitable_programs_and_qualified_distributions_0_100",
                "label": "Percentage of total revenue spent on charitable programs and qualified distributions (0-100%)",
                "type": "number",
                "required": true,
                "scoreLogic": "if value>=90 then 6 elif value>=80 then 4.5 elif value>=70 then 3 elif value>=60 then 1.5 else 0",
                "options": [],
                "rubricItem": {
                    "id": "ea8a551b-fda2-496b-ac35-9bc0762e8236",
                    "weight": "1",
                    "maxScore": "0",
                    "exclusion": false,
                    "criteria": []
                }
            },
            {
                "id": "2b9865b0-b937-459a-87af-11028b503d76",
                "code": "F05",
                "fieldKey": "percentage_of_total_revenue_spent_on_fundraising_0_100",
                "label": "Percentage of total revenue spent on fundraising (0-100%)",
                "type": "number",
                "required": true,
                "scoreLogic": "if value<=10 then 6 elif value<=15 then 4.5 elif value<=20 then 3 elif value<=25 then 1.5 else 0",
                "options": [],
                "rubricItem": {
                    "id": "021934ea-bc78-468b-9b6a-0bc7aec7f1de",
                    "weight": "1",
                    "maxScore": "0",
                    "exclusion": false,
                    "criteria": []
                }
            },
            {
                "id": "2543a1c0-9b77-430b-9c74-ecb46409ecdb",
                "code": "F06",
                "fieldKey": "percentage_of_total_revenue_spent_on_administrative_expenses_0_100",
                "label": "Percentage of total revenue spent on administrative expenses (0-100%)",
                "type": "number",
                "required": true,
                "scoreLogic": "if value<=5 then 6 elif value<=10 then 4.5 elif value<=15 then 3 elif value<=20 then 1.5 else 0",
                "options": [],
                "rubricItem": {
                    "id": "bf61a075-6fdb-4abf-aee6-e9172d5066c2",
                    "weight": "1",
                    "maxScore": "0",
                    "exclusion": false,
                    "criteria": []
                }
            },
{
                "id": "c9cdc230-7965-4c35-b552-c9d7ea5b36bd",
                "code": "F17",
                "fieldKey": "percentage_of_total_revenue_spent_on_compensation_0_100",
                "label": "Compensation %",
                "type": "number",
                "required": true,
                "scoreLogic": null,
                "options": [],
                "rubricItem": null
            },
            {
                "id": "f19a1000-aaaa-4bbb-8ccc-000000000003",
                "code": "F19",
                "fieldKey": "qd_percent",
                "label": "QD Spend %",
                "type": "number",
                "required": false,
                "scoreLogic": null,
                "options": [],
                "rubricItem": null
            },
            {
                "id": "06b51593-90f6-476c-a9d9-7a7add9f031d",
                "code": "F07",
                "fieldKey": "percentage_of_revenue_spent_per_year_spent_revenue",
                "label": "Percentage of revenue spent per year (spent / revenue)",
                "type": "number",
                "required": true,
                "scoreLogic": "if value>=100 then 3 elif value>=66.67 then 2.25 elif value>=50 then 1.5 elif value>=33.3 then 0.75 else 0",
                "options": [],
                "rubricItem": {
                    "id": "1c9c2377-b44a-4ec6-882b-7294127831d0",
                    "weight": "1",
                    "maxScore": "0",
                    "exclusion": false,
                    "criteria": []
                }
            },
{
                "id": "88aa972d-9bc7-43d2-a22e-8ce483ab6ba7",
                "code": "F18",
                "fieldKey": "reserves_in_months",
                "label": "Reserves (months)",
                "type": "number",
                "required": true,
                "scoreLogic": null,
                "options": [],
                "rubricItem": null
            },
                                                            {
                "id": "a75dd775-cd34-4789-a88d-2e95abc4f294",
                "code": "F08",
                "fieldKey": "financials_link",
                "label": "Financials (Link)",
                "type": "text",
                "required": true,
                "scoreLogic": null,
                "options": [],
                "rubricItem": null
            },
{
                "id": "f5f83121-40b8-4b86-aef9-6750e177fb27",
                "code": "F11",
                "fieldKey": "cra_s_returns_link",
                "label": "CRA's Returns (Link)",
                "type": "text",
                "required": true,
                "scoreLogic": null,
                "options": [],
                "rubricItem": null
            },
            {
                "id": "0256bd6b-e0b5-4fd5-b8d9-d53b6b81947b",
                "code": "F12",
                "fieldKey": "end_of_fiscal_year",
                "label": "End of fiscal year",
                "type": "date",
                "required": true,
                "scoreLogic": null,
                "options": [],
                "rubricItem": null
            },
            {
                "id": "dca53eb2-9f09-42d2-9a25-a2018e6cd647",
                "code": "F13",
                "fieldKey": "charitable_registration_since",
                "label": "Charitable Registration since",
                "type": "date",
                "required": false,
                "scoreLogic": null,
                "options": [],
                "rubricItem": null
            },
            {
                "id": "2a31e2f5-592a-49c6-b6a3-d928e5ee3fd7",
                "code": "F14",
                "fieldKey": "analysis_reviewed_date",
                "label": "SNK Team's Analysis Date",
                "type": "date",
                "required": false,
                "scoreLogic": null,
                "options": [],
                "rubricItem": null
            },
            {
                "id": "c4022d7e-af48-404b-b25a-063ad73a8709",
                "code": "F15",
                "fieldKey": "notes",
                "label": "Notes",
                "type": "paragraph",
                "required": false,
                "scoreLogic": null,
                "options": [],
                "rubricItem": null
            }
        ]
    }
]

export function labelToSnakeCase(str: string): string {
    return str
        .toLowerCase()
        .replace(/[?]/g, '')
        .replace(/[()]/g, '')
        .replace(/%/g, '')
        .replace(/\//g, '')
        .trim()
        .replace(/[\s-]+/g, '_');
}

export function getQuestionFieldKey(question: { fieldKey?: string; code: string; label: string }): string {
    return question.fieldKey ?? labelToSnakeCase(question.label);
}
