export default {
    "scalars": [
        32,
        35,
        36,
        42,
        44,
        45,
        47,
        53,
        54,
        55,
        58,
        59,
        60,
        66,
        85,
        91,
        92,
        94
    ],
    "types": {
        "Access": {
            "createAppRequestOther": [
                47
            ],
            "createAppRequestSelf": [
                47
            ],
            "createPeriod": [
                47
            ],
            "createRole": [
                47
            ],
            "manageAnnouncements": [
                47
            ],
            "user": [
                17
            ],
            "viewAnnouncementManagement": [
                47
            ],
            "viewAppRequestList": [
                47
            ],
            "viewApplicantDashboard": [
                47
            ],
            "viewMetrics": [
                47
            ],
            "viewPeriodManagement": [
                47
            ],
            "viewReviewerInterface": [
                47
            ],
            "viewRoleManagement": [
                47
            ],
            "__typename": [
                94
            ]
        },
        "AccessControl": {
            "description": [
                94
            ],
            "name": [
                94
            ],
            "__typename": [
                94
            ]
        },
        "AccessControlGroup": {
            "controls": [
                1
            ],
            "description": [
                94
            ],
            "name": [
                94
            ],
            "tags": [
                15
            ],
            "title": [
                94
            ],
            "__typename": [
                94
            ]
        },
        "AccessGrantTag": {
            "category": [
                94
            ],
            "categoryLabel": [
                94
            ],
            "description": [
                94
            ],
            "label": [
                94
            ],
            "tag": [
                94
            ],
            "__typename": [
                94
            ]
        },
        "AccessRole": {
            "actions": [
                93
            ],
            "description": [
                94
            ],
            "grants": [
                6
            ],
            "groups": [
                10
            ],
            "id": [
                55
            ],
            "name": [
                94
            ],
            "scope": [
                94
            ],
            "__typename": [
                94
            ]
        },
        "AccessRoleFilter": {
            "groups": [
                94
            ],
            "ids": [
                55
            ],
            "names": [
                94
            ],
            "scopes": [
                94
            ],
            "__typename": [
                94
            ]
        },
        "AccessRoleGrant": {
            "actions": [
                7
            ],
            "allow": [
                47
            ],
            "controlGroup": [
                2
            ],
            "controls": [
                94
            ],
            "id": [
                55
            ],
            "tags": [
                3
            ],
            "__typename": [
                94
            ]
        },
        "AccessRoleGrantActions": {
            "delete": [
                47
            ],
            "update": [
                47
            ],
            "__typename": [
                94
            ]
        },
        "AccessRoleGrantCreate": {
            "allow": [
                47
            ],
            "controlGroup": [
                94
            ],
            "controls": [
                94
            ],
            "tags": [
                16
            ],
            "__typename": [
                94
            ]
        },
        "AccessRoleGrantUpdate": {
            "allow": [
                47
            ],
            "controlGroup": [
                94
            ],
            "controls": [
                94
            ],
            "tags": [
                16
            ],
            "__typename": [
                94
            ]
        },
        "AccessRoleGroup": {
            "dateAdded": [
                53
            ],
            "dateCreated": [
                53
            ],
            "groupName": [
                94
            ],
            "managers": [
                11
            ],
            "roleId": [
                55
            ],
            "__typename": [
                94
            ]
        },
        "AccessRoleGroupManager": {
            "email": [
                94
            ],
            "fullname": [
                94
            ],
            "__typename": [
                94
            ]
        },
        "AccessRoleInput": {
            "description": [
                94
            ],
            "groups": [
                94
            ],
            "name": [
                94
            ],
            "scope": [
                94
            ],
            "__typename": [
                94
            ]
        },
        "AccessRoleValidatedResponse": {
            "accessRole": [
                4
            ],
            "messages": [
                65
            ],
            "success": [
                47
            ],
            "__typename": [
                94
            ]
        },
        "AccessTag": {
            "description": [
                94
            ],
            "label": [
                94
            ],
            "value": [
                94
            ],
            "__typename": [
                94
            ]
        },
        "AccessTagCategory": {
            "category": [
                94
            ],
            "description": [
                94
            ],
            "label": [
                94
            ],
            "listable": [
                47
            ],
            "tags": [
                14
            ],
            "__typename": [
                94
            ]
        },
        "AccessTagInput": {
            "category": [
                94
            ],
            "tag": [
                94
            ],
            "__typename": [
                94
            ]
        },
        "AccessUser": {
            "email": [
                94
            ],
            "fullname": [
                94
            ],
            "groups": [
                94
            ],
            "login": [
                55
            ],
            "otherIdentifiers": [
                20
            ],
            "otherInfo": [
                60
            ],
            "roles": [
                4
            ],
            "stillValid": [
                47
            ],
            "__typename": [
                94
            ]
        },
        "AccessUserCategoryInput": {
            "category": [
                55
            ],
            "tags": [
                55
            ],
            "__typename": [
                94
            ]
        },
        "AccessUserFilter": {
            "logins": [
                55
            ],
            "otherCategoriesByLabel": [
                18
            ],
            "otherIdentifiers": [
                94
            ],
            "otherIdentifiersByLabel": [
                21
            ],
            "roles": [
                94
            ],
            "search": [
                94
            ],
            "self": [
                47
            ],
            "__typename": [
                94
            ]
        },
        "AccessUserIdentifier": {
            "id": [
                55
            ],
            "label": [
                94
            ],
            "__typename": [
                94
            ]
        },
        "AccessUserIdentifierInput": {
            "id": [
                55
            ],
            "label": [
                94
            ],
            "__typename": [
                94
            ]
        },
        "Announcement": {
            "body": [
                94
            ],
            "enabled": [
                47
            ],
            "end": [
                53
            ],
            "id": [
                55
            ],
            "isActive": [
                47
            ],
            "link": [
                94
            ],
            "linkText": [
                94
            ],
            "start": [
                53
            ],
            "subject": [
                94
            ],
            "type": [
                94
            ],
            "__typename": [
                94
            ]
        },
        "AnnouncementFilters": {
            "active": [
                47
            ],
            "enabled": [
                47
            ],
            "ids": [
                55
            ],
            "__typename": [
                94
            ]
        },
        "AnnouncementUpdate": {
            "body": [
                94
            ],
            "enabled": [
                47
            ],
            "end": [
                53
            ],
            "link": [
                94
            ],
            "linkText": [
                94
            ],
            "start": [
                53
            ],
            "subject": [
                94
            ],
            "type": [
                94
            ],
            "__typename": [
                94
            ]
        },
        "AppRequest": {
            "actions": [
                26
            ],
            "applicant": [
                17
            ],
            "applications": [
                37,
                {
                    "programKeys": [
                        94,
                        "[String!]"
                    ]
                }
            ],
            "awaitingCorrection": [
                47
            ],
            "closedAt": [
                53
            ],
            "createdAt": [
                53
            ],
            "data": [
                60,
                {
                    "schemaVersion": [
                        94
                    ]
                }
            ],
            "dataVersion": [
                59
            ],
            "id": [
                55
            ],
            "indexCategories": [
                31,
                {
                    "for": [
                        32
                    ]
                }
            ],
            "notes": [
                67,
                {
                    "filter": [
                        34
                    ]
                }
            ],
            "otherNotes": [
                67,
                {
                    "filter": [
                        34
                    ]
                }
            ],
            "period": [
                72
            ],
            "phase": [
                35
            ],
            "prompt": [
                88,
                {
                    "promptId": [
                        55,
                        "ID!"
                    ]
                }
            ],
            "status": [
                36
            ],
            "statusReason": [
                94
            ],
            "submittedAt": [
                53
            ],
            "updatedAt": [
                53
            ],
            "__typename": [
                94
            ]
        },
        "AppRequestActions": {
            "acceptOffer": [
                47
            ],
            "cancel": [
                47
            ],
            "close": [
                47
            ],
            "completeRequest": [
                47
            ],
            "completeReview": [
                47
            ],
            "createNote": [
                47
            ],
            "createPersistentNote": [
                47
            ],
            "reopen": [
                47
            ],
            "returnToApplicant": [
                47
            ],
            "returnToNonBlocking": [
                47
            ],
            "returnToOffer": [
                47
            ],
            "returnToReview": [
                47
            ],
            "review": [
                47
            ],
            "submit": [
                47
            ],
            "viewAcceptUI": [
                47
            ],
            "viewApplyUI": [
                47
            ],
            "__typename": [
                94
            ]
        },
        "AppRequestActivity": {
            "action": [
                94
            ],
            "appRequest": [
                25
            ],
            "createdAt": [
                53
            ],
            "data": [
                60
            ],
            "description": [
                94
            ],
            "id": [
                55
            ],
            "impersonatedBy": [
                17
            ],
            "user": [
                17
            ],
            "__typename": [
                94
            ]
        },
        "AppRequestActivityFilters": {
            "actions": [
                94
            ],
            "appRequestIds": [
                55
            ],
            "happenedAfter": [
                53
            ],
            "happenedBefore": [
                53
            ],
            "impersonated": [
                47
            ],
            "impersonatedBy": [
                55
            ],
            "impersonatedUsers": [
                55
            ],
            "search": [
                94
            ],
            "users": [
                55
            ],
            "__typename": [
                94
            ]
        },
        "AppRequestApplicantCounts": {
            "firstTime": [
                59
            ],
            "returning": [
                59
            ],
            "__typename": [
                94
            ]
        },
        "AppRequestFilter": {
            "applicationStatuses": [
                46
            ],
            "closed": [
                47
            ],
            "closedAfter": [
                53
            ],
            "closedBefore": [
                53
            ],
            "complete": [
                47
            ],
            "createdAfter": [
                53
            ],
            "createdBefore": [
                53
            ],
            "ids": [
                55
            ],
            "indexes": [
                33
            ],
            "logins": [
                55
            ],
            "own": [
                47
            ],
            "periodIds": [
                55
            ],
            "programKeys": [
                55
            ],
            "rescindedStatus": [
                44
            ],
            "reviewStarted": [
                47
            ],
            "search": [
                94
            ],
            "status": [
                36
            ],
            "submittedAfter": [
                53
            ],
            "submittedBefore": [
                53
            ],
            "updatedAfter": [
                53
            ],
            "updatedBefore": [
                53
            ],
            "__typename": [
                94
            ]
        },
        "AppRequestIndexCategory": {
            "appRequestListPriority": [
                54
            ],
            "applicantDashboardPriority": [
                54
            ],
            "category": [
                94
            ],
            "categoryLabel": [
                94
            ],
            "listFiltersPriority": [
                54
            ],
            "listable": [
                47
            ],
            "reviewerDashboardPriority": [
                54
            ],
            "values": [
                57
            ],
            "__typename": [
                94
            ]
        },
        "AppRequestIndexDestination": {},
        "AppRequestIndexFilter": {
            "category": [
                94
            ],
            "tags": [
                94
            ],
            "__typename": [
                94
            ]
        },
        "AppRequestNoteFilters": {
            "appRequestIds": [
                55
            ],
            "applicants": [
                94
            ],
            "ids": [
                55
            ],
            "__typename": [
                94
            ]
        },
        "AppRequestPhase": {},
        "AppRequestStatus": {},
        "Application": {
            "actions": [
                38
            ],
            "applicantDescription": [
                94
            ],
            "awaitingCorrection": [
                47
            ],
            "completesAfterNonBlocking": [
                47
            ],
            "eligibilityDescription": [
                94
            ],
            "hiddenIneligiblePreSubmit": [
                47
            ],
            "id": [
                55
            ],
            "ineligiblePhase": [
                58
            ],
            "navTitle": [
                94
            ],
            "nextWorkflowStage": [
                80
            ],
            "phase": [
                42
            ],
            "previousWorkflowStage": [
                80
            ],
            "programKey": [
                94
            ],
            "requirements": [
                43
            ],
            "rescindedReason": [
                94
            ],
            "rescindedStatus": [
                44
            ],
            "restoredReason": [
                94
            ],
            "status": [
                45
            ],
            "statusReason": [
                94
            ],
            "title": [
                94
            ],
            "workflowStage": [
                80
            ],
            "workflowStages": [
                80
            ],
            "__typename": [
                94
            ]
        },
        "ApplicationActions": {
            "advanceWorkflow": [
                47
            ],
            "completeApplication": [
                47
            ],
            "reopenApplication": [
                47
            ],
            "rescindApplication": [
                47
            ],
            "restoreApplication": [
                47
            ],
            "reverseWorkflow": [
                47
            ],
            "viewAsReviewer": [
                47
            ],
            "__typename": [
                94
            ]
        },
        "ApplicationMetric": {
            "approved": [
                54
            ],
            "closed": [
                54
            ],
            "denied": [
                54
            ],
            "entries": [
                40
            ],
            "rescinded": [
                54
            ],
            "started": [
                54
            ],
            "submitted": [
                54
            ],
            "toDecision": [
                41
            ],
            "toSubmit": [
                41
            ],
            "__typename": [
                94
            ]
        },
        "ApplicationMetricEntry": {
            "appRequestId": [
                55
            ],
            "applicantFullname": [
                94
            ],
            "applicantId": [
                55
            ],
            "applicantLogin": [
                94
            ],
            "applicationId": [
                55
            ],
            "closedAt": [
                53
            ],
            "createdAt": [
                53
            ],
            "ineligiblePhase": [
                94
            ],
            "periodCode": [
                94
            ],
            "periodId": [
                55
            ],
            "periodName": [
                94
            ],
            "phase": [
                94
            ],
            "programKey": [
                94
            ],
            "status": [
                94
            ],
            "submittedAt": [
                53
            ],
            "updatedAt": [
                53
            ],
            "__typename": [
                94
            ]
        },
        "ApplicationMetricTiming": {
            "avg": [
                54
            ],
            "max": [
                54
            ],
            "min": [
                54
            ],
            "__typename": [
                94
            ]
        },
        "ApplicationPhase": {},
        "ApplicationRequirement": {
            "application": [
                37
            ],
            "blame": [
                94
            ],
            "blameFields": [
                87
            ],
            "configurationData": [
                60
            ],
            "description": [
                94
            ],
            "id": [
                55
            ],
            "key": [
                94
            ],
            "navTitle": [
                94
            ],
            "prompts": [
                88,
                {
                    "filter": [
                        90
                    ]
                }
            ],
            "smartTitle": [
                94
            ],
            "status": [
                91
            ],
            "statusReason": [
                94
            ],
            "title": [
                94
            ],
            "type": [
                92
            ],
            "workflowStage": [
                80
            ],
            "__typename": [
                94
            ]
        },
        "ApplicationRescindedStatus": {},
        "ApplicationStatus": {},
        "ApplicationStatusFilter": {
            "rescindedStatus": [
                44
            ],
            "status": [
                45
            ],
            "__typename": [
                94
            ]
        },
        "Boolean": {},
        "Category": {
            "category": [
                94
            ],
            "label": [
                94
            ],
            "tags": [
                49
            ],
            "useInFilters": [
                47
            ],
            "useInList": [
                47
            ],
            "__typename": [
                94
            ]
        },
        "CategoryTag": {
            "label": [
                94
            ],
            "tag": [
                94
            ],
            "__typename": [
                94
            ]
        },
        "Configuration": {
            "actions": [
                51
            ],
            "data": [
                60
            ],
            "fetchedData": [
                60
            ],
            "key": [
                94
            ],
            "__typename": [
                94
            ]
        },
        "ConfigurationAccess": {
            "update": [
                47
            ],
            "view": [
                47
            ],
            "__typename": [
                94
            ]
        },
        "ConfigurationFilters": {
            "ids": [
                55
            ],
            "keys": [
                94
            ],
            "periodCodes": [
                94
            ],
            "periodIds": [
                55
            ],
            "__typename": [
                94
            ]
        },
        "DateTime": {},
        "Float": {},
        "ID": {},
        "IndexCategory": {
            "appRequestListPriority": [
                54
            ],
            "applicantDashboardPriority": [
                54
            ],
            "category": [
                94
            ],
            "categoryLabel": [
                94
            ],
            "listFiltersPriority": [
                54
            ],
            "listable": [
                47
            ],
            "reviewerDashboardPriority": [
                54
            ],
            "values": [
                57,
                {
                    "inUse": [
                        47
                    ],
                    "search": [
                        94
                    ]
                }
            ],
            "__typename": [
                94
            ]
        },
        "IndexValue": {
            "label": [
                94
            ],
            "value": [
                94
            ],
            "__typename": [
                94
            ]
        },
        "IneligiblePhases": {},
        "Int": {},
        "JsonData": {},
        "MetricAccessUserFilters": {
            "fullnames": [
                94
            ],
            "ids": [
                55
            ],
            "logins": [
                94
            ],
            "__typename": [
                94
            ]
        },
        "MetricApplicationFilters": {
            "applicants": [
                61
            ],
            "applicationIds": [
                55
            ],
            "closedAfterDateTime": [
                53
            ],
            "closedBeforeDateTime": [
                53
            ],
            "periods": [
                63
            ],
            "startedAfterDateTime": [
                53
            ],
            "startedBeforeDateTime": [
                53
            ],
            "submittedAfterDateTime": [
                53
            ],
            "submittedBeforeDateTime": [
                53
            ],
            "__typename": [
                94
            ]
        },
        "MetricPeriodFilters": {
            "codes": [
                94
            ],
            "ids": [
                55
            ],
            "names": [
                94
            ],
            "__typename": [
                94
            ]
        },
        "Mutation": {
            "acceptOffer": [
                96,
                {
                    "appRequestId": [
                        55,
                        "ID!"
                    ]
                }
            ],
            "addNote": [
                98,
                {
                    "appRequestId": [
                        55,
                        "ID!"
                    ],
                    "content": [
                        94,
                        "String!"
                    ],
                    "persistent": [
                        47
                    ],
                    "validateOnly": [
                        47
                    ]
                }
            ],
            "advanceWorkflow": [
                96,
                {
                    "applicationId": [
                        55,
                        "ID!"
                    ]
                }
            ],
            "cancelAppRequest": [
                96,
                {
                    "appRequestId": [
                        55,
                        "ID!"
                    ],
                    "dataVersion": [
                        59
                    ]
                }
            ],
            "closeAppRequest": [
                96,
                {
                    "appRequestId": [
                        55,
                        "ID!"
                    ]
                }
            ],
            "completeApplication": [
                96,
                {
                    "applicationId": [
                        55,
                        "ID!"
                    ]
                }
            ],
            "completeRequest": [
                96,
                {
                    "appRequestId": [
                        55,
                        "ID!"
                    ]
                }
            ],
            "completeReview": [
                96,
                {
                    "appRequestId": [
                        55,
                        "ID!"
                    ]
                }
            ],
            "createAnnouncement": [
                95,
                {
                    "announcement": [
                        24,
                        "AnnouncementUpdate!"
                    ],
                    "validateOnly": [
                        47
                    ]
                }
            ],
            "createAppRequest": [
                96,
                {
                    "login": [
                        94,
                        "String!"
                    ],
                    "periodId": [
                        55,
                        "ID!"
                    ],
                    "validateOnly": [
                        47
                    ]
                }
            ],
            "createPeriod": [
                99,
                {
                    "copyPeriodId": [
                        94
                    ],
                    "period": [
                        79,
                        "PeriodUpdate!"
                    ],
                    "validateOnly": [
                        47
                    ]
                }
            ],
            "deleteAnnouncement": [
                100,
                {
                    "announcementId": [
                        55,
                        "ID!"
                    ]
                }
            ],
            "deleteNote": [
                47,
                {
                    "noteId": [
                        55,
                        "ID!"
                    ]
                }
            ],
            "deletePeriod": [
                100,
                {
                    "periodId": [
                        55,
                        "ID!"
                    ]
                }
            ],
            "markPeriodReviewed": [
                99,
                {
                    "periodId": [
                        55,
                        "ID!"
                    ],
                    "validateOnly": [
                        47
                    ]
                }
            ],
            "reopenAppRequest": [
                96,
                {
                    "appRequestId": [
                        55,
                        "ID!"
                    ]
                }
            ],
            "reopenApplication": [
                96,
                {
                    "applicationId": [
                        55,
                        "ID!"
                    ]
                }
            ],
            "rescind": [
                96,
                {
                    "applicationId": [
                        55,
                        "ID!"
                    ],
                    "reason": [
                        94,
                        "String!"
                    ],
                    "validateOnly": [
                        47
                    ]
                }
            ],
            "restore": [
                96,
                {
                    "applicationId": [
                        55,
                        "ID!"
                    ],
                    "reason": [
                        94,
                        "String!"
                    ],
                    "validateOnly": [
                        47
                    ]
                }
            ],
            "returnToApplicant": [
                96,
                {
                    "appRequestId": [
                        55,
                        "ID!"
                    ]
                }
            ],
            "returnToNonBlocking": [
                96,
                {
                    "appRequestId": [
                        55,
                        "ID!"
                    ]
                }
            ],
            "returnToOffer": [
                96,
                {
                    "appRequestId": [
                        55,
                        "ID!"
                    ]
                }
            ],
            "returnToReview": [
                96,
                {
                    "appRequestId": [
                        55,
                        "ID!"
                    ]
                }
            ],
            "reverseWorkflow": [
                96,
                {
                    "applicationId": [
                        55,
                        "ID!"
                    ]
                }
            ],
            "roleAddGrant": [
                13,
                {
                    "grant": [
                        8,
                        "AccessRoleGrantCreate!"
                    ],
                    "roleId": [
                        55,
                        "ID!"
                    ],
                    "validateOnly": [
                        47
                    ]
                }
            ],
            "roleCreate": [
                13,
                {
                    "copyRoleId": [
                        55
                    ],
                    "role": [
                        12,
                        "AccessRoleInput!"
                    ],
                    "validateOnly": [
                        47
                    ]
                }
            ],
            "roleDelete": [
                100,
                {
                    "roleId": [
                        55,
                        "ID!"
                    ]
                }
            ],
            "roleDeleteGrant": [
                13,
                {
                    "grantId": [
                        55,
                        "ID!"
                    ]
                }
            ],
            "roleUpdate": [
                13,
                {
                    "role": [
                        12,
                        "AccessRoleInput!"
                    ],
                    "roleId": [
                        55,
                        "ID!"
                    ],
                    "validateOnly": [
                        47
                    ]
                }
            ],
            "roleUpdateGrant": [
                13,
                {
                    "grant": [
                        9,
                        "AccessRoleGrantUpdate!"
                    ],
                    "grantId": [
                        55,
                        "ID!"
                    ],
                    "validateOnly": [
                        47
                    ]
                }
            ],
            "submitAppRequest": [
                96,
                {
                    "appRequestId": [
                        55,
                        "ID!"
                    ]
                }
            ],
            "togglePersistence": [
                98,
                {
                    "noteId": [
                        55,
                        "ID!"
                    ]
                }
            ],
            "updateAnnouncement": [
                95,
                {
                    "announcement": [
                        24,
                        "AnnouncementUpdate!"
                    ],
                    "announcementId": [
                        55,
                        "ID!"
                    ],
                    "validateOnly": [
                        47
                    ]
                }
            ],
            "updateConfiguration": [
                97,
                {
                    "data": [
                        60,
                        "JsonData!"
                    ],
                    "key": [
                        94,
                        "String!"
                    ],
                    "periodId": [
                        55,
                        "ID!"
                    ],
                    "validateOnly": [
                        47
                    ]
                }
            ],
            "updateNote": [
                98,
                {
                    "content": [
                        94,
                        "String!"
                    ],
                    "noteId": [
                        55,
                        "ID!"
                    ]
                }
            ],
            "updatePeriod": [
                99,
                {
                    "periodId": [
                        55,
                        "ID!"
                    ],
                    "update": [
                        79,
                        "PeriodUpdate!"
                    ],
                    "validateOnly": [
                        47
                    ]
                }
            ],
            "updatePeriodRequirement": [
                100,
                {
                    "disabled": [
                        47,
                        "Boolean!"
                    ],
                    "periodId": [
                        94,
                        "String!"
                    ],
                    "requirementKey": [
                        94,
                        "String!"
                    ]
                }
            ],
            "updatePrompt": [
                96,
                {
                    "data": [
                        60,
                        "JsonData!"
                    ],
                    "dataVersion": [
                        59
                    ],
                    "overrideInvalidated": [
                        47
                    ],
                    "promptId": [
                        55,
                        "ID!"
                    ],
                    "validateOnly": [
                        47
                    ]
                }
            ],
            "__typename": [
                94
            ]
        },
        "MutationMessage": {
            "arg": [
                94
            ],
            "message": [
                94
            ],
            "type": [
                66
            ],
            "__typename": [
                94
            ]
        },
        "MutationMessageType": {},
        "Note": {
            "actions": [
                68
            ],
            "appRequest": [
                25
            ],
            "author": [
                17
            ],
            "content": [
                94
            ],
            "createdAt": [
                53
            ],
            "id": [
                55
            ],
            "persistent": [
                47
            ],
            "updatedAt": [
                53
            ],
            "__typename": [
                94
            ]
        },
        "NoteActions": {
            "delete": [
                47
            ],
            "update": [
                47
            ],
            "updatePersistent": [
                47
            ],
            "__typename": [
                94
            ]
        },
        "Pagination": {
            "page": [
                59
            ],
            "perPage": [
                59
            ],
            "__typename": [
                94
            ]
        },
        "PaginationInfoWithTotalItems": {
            "categories": [
                48
            ],
            "currentPage": [
                54
            ],
            "hasNextPage": [
                47
            ],
            "perPage": [
                54
            ],
            "totalItems": [
                54
            ],
            "__typename": [
                94
            ]
        },
        "PaginationResponse": {
            "accessUsers": [
                70
            ],
            "appRequests": [
                70
            ],
            "appRequestsActivity": [
                70
            ],
            "__typename": [
                94
            ]
        },
        "Period": {
            "actions": [
                73
            ],
            "archiveDate": [
                53
            ],
            "closeDate": [
                53
            ],
            "code": [
                94
            ],
            "configurations": [
                50,
                {
                    "filter": [
                        52
                    ]
                }
            ],
            "id": [
                55
            ],
            "name": [
                94
            ],
            "openDate": [
                53
            ],
            "programs": [
                75
            ],
            "prompts": [
                78
            ],
            "requirements": [
                77
            ],
            "reviewed": [
                47
            ],
            "__typename": [
                94
            ]
        },
        "PeriodActions": {
            "createAppRequest": [
                47
            ],
            "delete": [
                47
            ],
            "update": [
                47
            ],
            "__typename": [
                94
            ]
        },
        "PeriodFilters": {
            "archiveAfter": [
                53
            ],
            "archiveBefore": [
                53
            ],
            "closesAfter": [
                53
            ],
            "closesBefore": [
                53
            ],
            "codes": [
                94
            ],
            "ids": [
                55
            ],
            "names": [
                94
            ],
            "openNow": [
                47
            ],
            "opensAfter": [
                53
            ],
            "opensBefore": [
                53
            ],
            "__typename": [
                94
            ]
        },
        "PeriodProgram": {
            "actions": [
                76
            ],
            "applicantDescription": [
                94
            ],
            "configuration": [
                50
            ],
            "eligibilityDescription": [
                94
            ],
            "enabled": [
                47
            ],
            "key": [
                55
            ],
            "navTitle": [
                94
            ],
            "period": [
                72
            ],
            "requirements": [
                77
            ],
            "title": [
                94
            ],
            "__typename": [
                94
            ]
        },
        "PeriodProgramActions": {
            "configure": [
                47
            ],
            "__typename": [
                94
            ]
        },
        "PeriodProgramRequirement": {
            "configuration": [
                50
            ],
            "description": [
                94
            ],
            "enabled": [
                47
            ],
            "key": [
                94
            ],
            "navTitle": [
                94
            ],
            "prompts": [
                78
            ],
            "title": [
                94
            ],
            "type": [
                92
            ],
            "__typename": [
                94
            ]
        },
        "PeriodPrompt": {
            "configuration": [
                50
            ],
            "description": [
                94
            ],
            "key": [
                94
            ],
            "navTitle": [
                94
            ],
            "periodId": [
                94
            ],
            "title": [
                94
            ],
            "__typename": [
                94
            ]
        },
        "PeriodUpdate": {
            "archiveDate": [
                53
            ],
            "closeDate": [
                53
            ],
            "code": [
                94
            ],
            "name": [
                94
            ],
            "openDate": [
                53
            ],
            "__typename": [
                94
            ]
        },
        "PeriodWorkflowStage": {
            "blocking": [
                47
            ],
            "key": [
                94
            ],
            "title": [
                94
            ],
            "__typename": [
                94
            ]
        },
        "Program": {
            "applicantDescription": [
                94
            ],
            "eligibilityDescription": [
                94
            ],
            "key": [
                55
            ],
            "navTitle": [
                94
            ],
            "title": [
                94
            ],
            "__typename": [
                94
            ]
        },
        "ProgramFilters": {
            "keys": [
                94
            ],
            "__typename": [
                94
            ]
        },
        "PromptFieldReason": {
            "fields": [
                94
            ],
            "message": [
                94
            ],
            "status": [
                91
            ],
            "__typename": [
                94
            ]
        },
        "PromptStatusReason": {
            "blamed": [
                47
            ],
            "fieldReasons": [
                83
            ],
            "programName": [
                94
            ],
            "status": [
                91
            ],
            "statusReason": [
                94
            ],
            "__typename": [
                94
            ]
        },
        "PromptVisibility": {},
        "Query": {
            "access": [
                0
            ],
            "accessUsers": [
                17,
                {
                    "filter": [
                        19
                    ],
                    "paged": [
                        69
                    ]
                }
            ],
            "announcements": [
                22,
                {
                    "filter": [
                        23
                    ]
                }
            ],
            "appRequestActivity": [
                27,
                {
                    "filters": [
                        28
                    ],
                    "id": [
                        94,
                        "String!"
                    ],
                    "paged": [
                        69
                    ]
                }
            ],
            "appRequestActivityActions": [
                94,
                {
                    "id": [
                        94,
                        "String!"
                    ]
                }
            ],
            "appRequestActivityUsers": [
                17,
                {
                    "id": [
                        94,
                        "String!"
                    ]
                }
            ],
            "appRequestIndexes": [
                56,
                {
                    "categories": [
                        94,
                        "[String!]"
                    ],
                    "for": [
                        32
                    ]
                }
            ],
            "appRequests": [
                25,
                {
                    "filter": [
                        30
                    ],
                    "paged": [
                        69
                    ]
                }
            ],
            "applicationMetrics": [
                39,
                {
                    "filter": [
                        62
                    ]
                }
            ],
            "controlGroups": [
                2
            ],
            "countAppRequestApplicants": [
                29,
                {
                    "filter": [
                        30
                    ]
                }
            ],
            "countAppRequests": [
                59,
                {
                    "filter": [
                        30
                    ]
                }
            ],
            "pageInfo": [
                71
            ],
            "periods": [
                72,
                {
                    "filter": [
                        74
                    ]
                }
            ],
            "programs": [
                81,
                {
                    "filter": [
                        82
                    ]
                }
            ],
            "roles": [
                4,
                {
                    "filter": [
                        5
                    ]
                }
            ],
            "scopes": [
                94
            ],
            "userIndexes": [
                56,
                {
                    "for": [
                        32
                    ]
                }
            ],
            "__typename": [
                94
            ]
        },
        "RequirementBlame": {
            "fields": [
                94
            ],
            "message": [
                94
            ],
            "promptKey": [
                94
            ],
            "status": [
                91
            ],
            "__typename": [
                94
            ]
        },
        "RequirementPrompt": {
            "actions": [
                89
            ],
            "answered": [
                47
            ],
            "configurationData": [
                60
            ],
            "data": [
                60,
                {
                    "schemaVersion": [
                        94
                    ]
                }
            ],
            "description": [
                94
            ],
            "fetchedData": [
                60,
                {
                    "schemaVersion": [
                        94
                    ]
                }
            ],
            "gatheredConfigData": [
                60
            ],
            "hasSavedData": [
                47
            ],
            "id": [
                55
            ],
            "invalidated": [
                47
            ],
            "invalidatedReason": [
                94
            ],
            "key": [
                94
            ],
            "moot": [
                47
            ],
            "navTitle": [
                94
            ],
            "noDisplay": [
                47
            ],
            "optOut": [
                47
            ],
            "preloadData": [
                60,
                {
                    "schemaVersion": [
                        94
                    ]
                }
            ],
            "prestageData": [
                60,
                {
                    "schemaVersion": [
                        94
                    ]
                }
            ],
            "requirement": [
                43
            ],
            "title": [
                94
            ],
            "visibility": [
                85
            ],
            "__typename": [
                94
            ]
        },
        "RequirementPromptActions": {
            "update": [
                47
            ],
            "__typename": [
                94
            ]
        },
        "RequirementPromptFilter": {
            "answered": [
                47
            ],
            "appRequestIds": [
                55
            ],
            "applicationIds": [
                55
            ],
            "ids": [
                55
            ],
            "promptKeys": [
                94
            ],
            "reachable": [
                47
            ],
            "requirementIds": [
                55
            ],
            "__typename": [
                94
            ]
        },
        "RequirementStatus": {},
        "RequirementType": {},
        "RoleActions": {
            "delete": [
                47
            ],
            "update": [
                47
            ],
            "__typename": [
                94
            ]
        },
        "String": {},
        "ValidatedAnnouncementResponse": {
            "announcement": [
                22
            ],
            "messages": [
                65
            ],
            "success": [
                47
            ],
            "__typename": [
                94
            ]
        },
        "ValidatedAppRequestResponse": {
            "appRequest": [
                25
            ],
            "messages": [
                65
            ],
            "statusReasons": [
                84
            ],
            "success": [
                47
            ],
            "__typename": [
                94
            ]
        },
        "ValidatedConfigurationResponse": {
            "configuration": [
                50
            ],
            "messages": [
                65
            ],
            "success": [
                47
            ],
            "__typename": [
                94
            ]
        },
        "ValidatedNoteResponse": {
            "messages": [
                65
            ],
            "note": [
                67
            ],
            "success": [
                47
            ],
            "__typename": [
                94
            ]
        },
        "ValidatedPeriodResponse": {
            "messages": [
                65
            ],
            "period": [
                72
            ],
            "success": [
                47
            ],
            "__typename": [
                94
            ]
        },
        "ValidatedResponse": {
            "messages": [
                65
            ],
            "success": [
                47
            ],
            "__typename": [
                94
            ]
        }
    }
}