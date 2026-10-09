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
        83,
        88,
        89,
        91
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
                91
            ]
        },
        "AccessControl": {
            "description": [
                91
            ],
            "name": [
                91
            ],
            "__typename": [
                91
            ]
        },
        "AccessControlGroup": {
            "controls": [
                1
            ],
            "description": [
                91
            ],
            "name": [
                91
            ],
            "tags": [
                15
            ],
            "title": [
                91
            ],
            "__typename": [
                91
            ]
        },
        "AccessGrantTag": {
            "category": [
                91
            ],
            "categoryLabel": [
                91
            ],
            "description": [
                91
            ],
            "label": [
                91
            ],
            "tag": [
                91
            ],
            "__typename": [
                91
            ]
        },
        "AccessRole": {
            "actions": [
                90
            ],
            "description": [
                91
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
                91
            ],
            "scope": [
                91
            ],
            "__typename": [
                91
            ]
        },
        "AccessRoleFilter": {
            "groups": [
                91
            ],
            "ids": [
                55
            ],
            "names": [
                91
            ],
            "scopes": [
                91
            ],
            "__typename": [
                91
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
                91
            ],
            "id": [
                55
            ],
            "tags": [
                3
            ],
            "__typename": [
                91
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
                91
            ]
        },
        "AccessRoleGrantCreate": {
            "allow": [
                47
            ],
            "controlGroup": [
                91
            ],
            "controls": [
                91
            ],
            "tags": [
                16
            ],
            "__typename": [
                91
            ]
        },
        "AccessRoleGrantUpdate": {
            "allow": [
                47
            ],
            "controlGroup": [
                91
            ],
            "controls": [
                91
            ],
            "tags": [
                16
            ],
            "__typename": [
                91
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
                91
            ],
            "managers": [
                11
            ],
            "roleId": [
                55
            ],
            "__typename": [
                91
            ]
        },
        "AccessRoleGroupManager": {
            "email": [
                91
            ],
            "fullname": [
                91
            ],
            "__typename": [
                91
            ]
        },
        "AccessRoleInput": {
            "description": [
                91
            ],
            "groups": [
                91
            ],
            "name": [
                91
            ],
            "scope": [
                91
            ],
            "__typename": [
                91
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
                91
            ]
        },
        "AccessTag": {
            "description": [
                91
            ],
            "label": [
                91
            ],
            "value": [
                91
            ],
            "__typename": [
                91
            ]
        },
        "AccessTagCategory": {
            "category": [
                91
            ],
            "description": [
                91
            ],
            "label": [
                91
            ],
            "listable": [
                47
            ],
            "tags": [
                14
            ],
            "__typename": [
                91
            ]
        },
        "AccessTagInput": {
            "category": [
                91
            ],
            "tag": [
                91
            ],
            "__typename": [
                91
            ]
        },
        "AccessUser": {
            "email": [
                91
            ],
            "fullname": [
                91
            ],
            "groups": [
                91
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
                91
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
                91
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
                91
            ],
            "otherIdentifiersByLabel": [
                21
            ],
            "roles": [
                91
            ],
            "search": [
                91
            ],
            "self": [
                47
            ],
            "__typename": [
                91
            ]
        },
        "AccessUserIdentifier": {
            "id": [
                55
            ],
            "label": [
                91
            ],
            "__typename": [
                91
            ]
        },
        "AccessUserIdentifierInput": {
            "id": [
                55
            ],
            "label": [
                91
            ],
            "__typename": [
                91
            ]
        },
        "Announcement": {
            "body": [
                91
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
                91
            ],
            "linkText": [
                91
            ],
            "start": [
                53
            ],
            "subject": [
                91
            ],
            "type": [
                91
            ],
            "__typename": [
                91
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
                91
            ]
        },
        "AnnouncementUpdate": {
            "body": [
                91
            ],
            "enabled": [
                47
            ],
            "end": [
                53
            ],
            "link": [
                91
            ],
            "linkText": [
                91
            ],
            "start": [
                53
            ],
            "subject": [
                91
            ],
            "type": [
                91
            ],
            "__typename": [
                91
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
                        91,
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
                        91
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
                85,
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
                91
            ],
            "submittedAt": [
                53
            ],
            "updatedAt": [
                53
            ],
            "__typename": [
                91
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
                91
            ]
        },
        "AppRequestActivity": {
            "action": [
                91
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
                91
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
                91
            ]
        },
        "AppRequestActivityFilters": {
            "actions": [
                91
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
                91
            ],
            "users": [
                55
            ],
            "__typename": [
                91
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
                91
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
                91
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
                91
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
                91
            ],
            "categoryLabel": [
                91
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
                91
            ]
        },
        "AppRequestIndexDestination": {},
        "AppRequestIndexFilter": {
            "category": [
                91
            ],
            "tags": [
                91
            ],
            "__typename": [
                91
            ]
        },
        "AppRequestNoteFilters": {
            "appRequestIds": [
                55
            ],
            "applicants": [
                91
            ],
            "ids": [
                55
            ],
            "__typename": [
                91
            ]
        },
        "AppRequestPhase": {},
        "AppRequestStatus": {},
        "Application": {
            "actions": [
                38
            ],
            "applicantDescription": [
                91
            ],
            "awaitingCorrection": [
                47
            ],
            "eligibilityDescription": [
                91
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
                91
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
                91
            ],
            "requirements": [
                43
            ],
            "rescindedReason": [
                91
            ],
            "rescindedStatus": [
                44
            ],
            "restoredReason": [
                91
            ],
            "status": [
                45
            ],
            "statusReason": [
                91
            ],
            "title": [
                91
            ],
            "workflowStage": [
                80
            ],
            "workflowStages": [
                80
            ],
            "__typename": [
                91
            ]
        },
        "ApplicationActions": {
            "advanceWorkflow": [
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
                91
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
                91
            ]
        },
        "ApplicationMetricEntry": {
            "appRequestId": [
                55
            ],
            "applicantFullname": [
                91
            ],
            "applicantId": [
                55
            ],
            "applicantLogin": [
                91
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
                91
            ],
            "periodCode": [
                91
            ],
            "periodId": [
                55
            ],
            "periodName": [
                91
            ],
            "phase": [
                91
            ],
            "programKey": [
                91
            ],
            "status": [
                91
            ],
            "submittedAt": [
                53
            ],
            "updatedAt": [
                53
            ],
            "__typename": [
                91
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
                91
            ]
        },
        "ApplicationPhase": {},
        "ApplicationRequirement": {
            "application": [
                37
            ],
            "blame": [
                91
            ],
            "configurationData": [
                60
            ],
            "description": [
                91
            ],
            "id": [
                55
            ],
            "key": [
                91
            ],
            "navTitle": [
                91
            ],
            "prompts": [
                85,
                {
                    "filter": [
                        87
                    ]
                }
            ],
            "smartTitle": [
                91
            ],
            "status": [
                88
            ],
            "statusReason": [
                91
            ],
            "title": [
                91
            ],
            "type": [
                89
            ],
            "workflowStage": [
                80
            ],
            "__typename": [
                91
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
                91
            ]
        },
        "Boolean": {},
        "Category": {
            "category": [
                91
            ],
            "label": [
                91
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
                91
            ]
        },
        "CategoryTag": {
            "label": [
                91
            ],
            "tag": [
                91
            ],
            "__typename": [
                91
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
                91
            ],
            "__typename": [
                91
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
                91
            ]
        },
        "ConfigurationFilters": {
            "ids": [
                55
            ],
            "keys": [
                91
            ],
            "periodCodes": [
                91
            ],
            "periodIds": [
                55
            ],
            "__typename": [
                91
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
                91
            ],
            "categoryLabel": [
                91
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
                        91
                    ]
                }
            ],
            "__typename": [
                91
            ]
        },
        "IndexValue": {
            "label": [
                91
            ],
            "value": [
                91
            ],
            "__typename": [
                91
            ]
        },
        "IneligiblePhases": {},
        "Int": {},
        "JsonData": {},
        "MetricAccessUserFilters": {
            "fullnames": [
                91
            ],
            "ids": [
                55
            ],
            "logins": [
                91
            ],
            "__typename": [
                91
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
                91
            ]
        },
        "MetricPeriodFilters": {
            "codes": [
                91
            ],
            "ids": [
                55
            ],
            "names": [
                91
            ],
            "__typename": [
                91
            ]
        },
        "Mutation": {
            "acceptOffer": [
                93,
                {
                    "appRequestId": [
                        55,
                        "ID!"
                    ]
                }
            ],
            "addNote": [
                95,
                {
                    "appRequestId": [
                        55,
                        "ID!"
                    ],
                    "content": [
                        91,
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
                93,
                {
                    "applicationId": [
                        55,
                        "ID!"
                    ]
                }
            ],
            "cancelAppRequest": [
                93,
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
                93,
                {
                    "appRequestId": [
                        55,
                        "ID!"
                    ]
                }
            ],
            "completeRequest": [
                93,
                {
                    "appRequestId": [
                        55,
                        "ID!"
                    ]
                }
            ],
            "completeReview": [
                93,
                {
                    "appRequestId": [
                        55,
                        "ID!"
                    ]
                }
            ],
            "createAnnouncement": [
                92,
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
                93,
                {
                    "login": [
                        91,
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
                96,
                {
                    "copyPeriodId": [
                        91
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
                97,
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
                97,
                {
                    "periodId": [
                        55,
                        "ID!"
                    ]
                }
            ],
            "markPeriodReviewed": [
                96,
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
                93,
                {
                    "appRequestId": [
                        55,
                        "ID!"
                    ]
                }
            ],
            "rescind": [
                93,
                {
                    "applicationId": [
                        55,
                        "ID!"
                    ],
                    "reason": [
                        91,
                        "String!"
                    ],
                    "validateOnly": [
                        47
                    ]
                }
            ],
            "restore": [
                93,
                {
                    "applicationId": [
                        55,
                        "ID!"
                    ],
                    "reason": [
                        91,
                        "String!"
                    ],
                    "validateOnly": [
                        47
                    ]
                }
            ],
            "returnToApplicant": [
                93,
                {
                    "appRequestId": [
                        55,
                        "ID!"
                    ]
                }
            ],
            "returnToNonBlocking": [
                93,
                {
                    "appRequestId": [
                        55,
                        "ID!"
                    ]
                }
            ],
            "returnToOffer": [
                93,
                {
                    "appRequestId": [
                        55,
                        "ID!"
                    ]
                }
            ],
            "returnToReview": [
                93,
                {
                    "appRequestId": [
                        55,
                        "ID!"
                    ]
                }
            ],
            "reverseWorkflow": [
                93,
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
                97,
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
                93,
                {
                    "appRequestId": [
                        55,
                        "ID!"
                    ]
                }
            ],
            "togglePersistence": [
                95,
                {
                    "noteId": [
                        55,
                        "ID!"
                    ]
                }
            ],
            "updateAnnouncement": [
                92,
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
                94,
                {
                    "data": [
                        60,
                        "JsonData!"
                    ],
                    "key": [
                        91,
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
                95,
                {
                    "content": [
                        91,
                        "String!"
                    ],
                    "noteId": [
                        55,
                        "ID!"
                    ]
                }
            ],
            "updatePeriod": [
                96,
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
                97,
                {
                    "disabled": [
                        47,
                        "Boolean!"
                    ],
                    "periodId": [
                        91,
                        "String!"
                    ],
                    "requirementKey": [
                        91,
                        "String!"
                    ]
                }
            ],
            "updatePrompt": [
                93,
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
                91
            ]
        },
        "MutationMessage": {
            "arg": [
                91
            ],
            "message": [
                91
            ],
            "type": [
                66
            ],
            "__typename": [
                91
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
                91
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
                91
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
                91
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
                91
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
                91
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
                91
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
                91
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
                91
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
                91
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
                91
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
                91
            ],
            "ids": [
                55
            ],
            "names": [
                91
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
                91
            ]
        },
        "PeriodProgram": {
            "actions": [
                76
            ],
            "applicantDescription": [
                91
            ],
            "configuration": [
                50
            ],
            "eligibilityDescription": [
                91
            ],
            "enabled": [
                47
            ],
            "key": [
                55
            ],
            "navTitle": [
                91
            ],
            "period": [
                72
            ],
            "requirements": [
                77
            ],
            "title": [
                91
            ],
            "__typename": [
                91
            ]
        },
        "PeriodProgramActions": {
            "configure": [
                47
            ],
            "__typename": [
                91
            ]
        },
        "PeriodProgramRequirement": {
            "configuration": [
                50
            ],
            "description": [
                91
            ],
            "enabled": [
                47
            ],
            "key": [
                91
            ],
            "navTitle": [
                91
            ],
            "prompts": [
                78
            ],
            "title": [
                91
            ],
            "type": [
                89
            ],
            "__typename": [
                91
            ]
        },
        "PeriodPrompt": {
            "configuration": [
                50
            ],
            "description": [
                91
            ],
            "key": [
                91
            ],
            "navTitle": [
                91
            ],
            "periodId": [
                91
            ],
            "title": [
                91
            ],
            "__typename": [
                91
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
                91
            ],
            "name": [
                91
            ],
            "openDate": [
                53
            ],
            "__typename": [
                91
            ]
        },
        "PeriodWorkflowStage": {
            "blocking": [
                47
            ],
            "key": [
                91
            ],
            "title": [
                91
            ],
            "__typename": [
                91
            ]
        },
        "Program": {
            "applicantDescription": [
                91
            ],
            "eligibilityDescription": [
                91
            ],
            "key": [
                55
            ],
            "navTitle": [
                91
            ],
            "title": [
                91
            ],
            "__typename": [
                91
            ]
        },
        "ProgramFilters": {
            "keys": [
                91
            ],
            "__typename": [
                91
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
                        91,
                        "String!"
                    ],
                    "paged": [
                        69
                    ]
                }
            ],
            "appRequestIndexes": [
                56,
                {
                    "categories": [
                        91,
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
                91
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
                91
            ]
        },
        "RequirementPrompt": {
            "actions": [
                86
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
                        91
                    ]
                }
            ],
            "description": [
                91
            ],
            "fetchedData": [
                60,
                {
                    "schemaVersion": [
                        91
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
                91
            ],
            "key": [
                91
            ],
            "moot": [
                47
            ],
            "navTitle": [
                91
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
                        91
                    ]
                }
            ],
            "prestageData": [
                60,
                {
                    "schemaVersion": [
                        91
                    ]
                }
            ],
            "requirement": [
                43
            ],
            "title": [
                91
            ],
            "visibility": [
                83
            ],
            "__typename": [
                91
            ]
        },
        "RequirementPromptActions": {
            "update": [
                47
            ],
            "__typename": [
                91
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
                91
            ],
            "reachable": [
                47
            ],
            "requirementIds": [
                55
            ],
            "__typename": [
                91
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
                91
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
                91
            ]
        },
        "ValidatedAppRequestResponse": {
            "appRequest": [
                25
            ],
            "messages": [
                65
            ],
            "success": [
                47
            ],
            "__typename": [
                91
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
                91
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
                91
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
                91
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
                91
            ]
        }
    }
}