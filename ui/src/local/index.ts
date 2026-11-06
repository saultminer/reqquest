import { PUBLIC_DEMO_INSTANCE } from '$env/static/public'
import { UIRegistry, type AnyUIConfig, type UIConfig } from '$lib'
// Per-demo key unions
// See demos/package.json keys:generate:ui.
import type {
  ComplexProgramKey, ComplexPromptKey, ComplexRequirementKey,
  DefaultProgramKey, DefaultPromptKey, DefaultRequirementKey,
  RcProgramKey, RcPromptKey, RcRequirementKey,
  SimpleProgramKey, SimplePromptKey, SimpleRequirementKey
} from './keys.generated.js'
/** default */
import DogWalker from 'carbon-icons-svelte/lib/DogWalker.svelte'
import Gamification from 'carbon-icons-svelte/lib/Gamification.svelte'
import PedestrianFamily from 'carbon-icons-svelte/lib/PedestrianFamily.svelte'
import YardPromptDisplay from './default/YardPromptDisplay.svelte'
import YardPrompt from './default/YardPrompt.svelte'
import CatTowerPromptDisplay from './default/CatTowerPromptDisplay.svelte'
import CatTowerPrompt from './default/CatTowerPrompt.svelte'
import TunaAllergyPromptDisplay from './default/TunaAllergyPromptDisplay.svelte'
import TunaAllergyPrompt from './default/TunaAllergyPrompt.svelte'
import SeemsNicePrompt from './default/SeemsNicePrompt.svelte'
import SeemsNicePromptDisplay from './default/SeemsNicePromptDisplay.svelte'
import ExerciseConfigure from './default/ExerciseConfigure.svelte'
import ExercisePrompt from './default/ExercisePrompt.svelte'
import ExercisePromptDisplay from './default/ExercisePromptDisplay.svelte'
import StatePrompt from './default/StatePrompt.svelte'
import StatePromptDisplay from './default/StatePromptDisplay.svelte'
import OtherCatsPrompt from './default/OtherCatsPrompt.svelte'
import OtherCatsPromptDisplay from './default/OtherCatsPromptDisplay.svelte'
import OtherCatsVaccinesPrompt from './default/OtherCatsVaccinesPrompt.svelte'
import OtherCatsVaccinesPromptDisplay from './default/OtherCatsVaccinesPromptDisplay.svelte'
import VaccineReviewPrompt from './default/VaccineReviewPrompt.svelte'
import VaccineReviewPromptDisplay from './default/VaccineReviewPromptDisplay.svelte'
import DefaultIntroPanelDefaultSlot from './default/IntroPanelDefaultSlot.svelte'

/** simple */
import ResidencePrompt from './simple/ResidencePrompt.svelte'
import ResidencePromptDisplay from './simple/ResidencePromptDisplay.svelte'
import ResidenceConfig from './simple/ResidenceConfig.svelte'
import ResidenceConfirmationReviewPrompt from './simple/ResidenceConfirmationReviewPrompt.svelte'
import ResidenceConfirmationReviewPromptDisplay from './simple/ResidenceConfirmationReviewPromptDisplay.svelte'
import Step1PostResidencePrompt from './simple/Step1PostResidencePrompt.svelte'
import Step1PostResidencePromptDisplay from './simple/Step1PostResidencePromptDisplay.svelte'
import Step2PostResidencePrompt from './simple/Step2PostResidencePrompt.svelte'
import Step2PostResidencePromptDisplay from './simple/Step2PostResidencePromptDisplay.svelte'
import Step3PostResidencePrompt from './simple/Step3PostResidencePrompt.svelte'
import Step3PostResidencePromptDisplay from './simple/Step3PostResidencePromptDisplay.svelte'
import ThanksOrNoThanksPrompt from './simple/ThanksOrNoThanksPrompt.svelte'
import ThanksOrNoThanksPromptDisplay from './simple/ThanksOrNoThanksPromptDisplay.svelte'
import IDValuesPrompt from './simple/IDValuesPrompt.svelte'
import IDValuesPromptDisplay from './simple/IDValuesPromptDisplay.svelte'
import IDValuesExtraDataPrompt from './simple/IDValuesExtraDataPrompt.svelte'
import IDValuesExtraDataPromptDisplay from './simple/IDValuesExtraDataPromptDisplay.svelte'
import SSNValuePrompt from './simple/SSNValuePrompt.svelte'
import SSNValuePromptDisplay from './simple/SSNValuePromptDisplay.svelte'

/** Complex */
import ComplexResidencePrompt from './complex/residence/ResidencePrompt.svelte'
import ComplexResidenceDisplayPrompt from './complex/residence/ResidenceDisplayPrompt.svelte'
import ComplexResidenceConfig from './complex/residence/ResidenceConfig.svelte'
import ComplexPetOwnerPrompt from './complex/petOwner/PetOwnerPrompt.svelte'
import ComplexPetOwnerDisplayPrompt from './complex/petOwner/PetOwnerDisplayPrompt.svelte'
import ComplexPreviousDogOwnerPrompt from './complex/dogOwner/PreviousDogOwnerPrompt.svelte'
import ComplexPreviousDogOwnerDisplayPrompt from './complex/dogOwner/PreviousDogOwnerDisplayPrompt.svelte'
import ComplexCurrentDogOwnerPrompt from './complex/dogOwner/CurrentDogOwnerPrompt.svelte'
import ComplexCurrentDogOwnerDisplayPrompt from './complex/dogOwner/CurrentDogOwnerDisplayPrompt.svelte'
import ComplexCurrentDogConfig from './complex/dogOwner/CurrentDogConfig.svelte'
import ComplexYardConfig from './complex/yard/YardConfig.svelte'
import ComplexYardPrompt from './complex/yard/YardPrompt.svelte'
import ComplexYardDisplayPrompt from './complex/yard/YardDisplayPrompt.svelte'
import ComplexOwnerDogAllergyPrompt from './complex/dogOwner/OwnerDogAllergyPrompt.svelte'
import ComplexOwnerDogAllergyDisplayPrompt from './complex/dogOwner/OwnerDogAllergyDisplayPrompt.svelte'
import ComplexDogExerciseConfig from './complex/dogOwner/DogExerciseConfig.svelte'
import ComplexDogExercisePrompt from './complex/dogOwner/DogExercisePrompt.svelte'
import ComplexDogExerciseDisplayPrompt from './complex/dogOwner/DogExerciseDisplayPrompt.svelte'
import ComplexPreviousCatOwnerPrompt from './complex/catOwner/PreviousCatOwnerPrompt.svelte'
import ComplexPreviousCatOwnerDisplayPrompt from './complex/catOwner/PreviousCatOwnerDisplayPrompt.svelte'
import ComplexCurrentCatConfig from './complex/catOwner/CurrentCatConfig.svelte'
import ComplexCurrentCatOwnerPrompt from './complex/catOwner/CurrentCatOwnerPrompt.svelte'
import ComplexCurrentCatOwnerDisplayPrompt from './complex/catOwner/CurrentCatOwnerDisplayPrompt.svelte'
import ComplexLivingSpaceConfig from './complex/livingSpace/LivingSpaceConfig.svelte'
import ComplexLivingSpacePrompt from './complex/livingSpace/LivingSpacePrompt.svelte'
import ComplexLivingSpaceDisplayPrompt from './complex/livingSpace/LivingSpaceDisplayPrompt.svelte'
import ComplexOwnerCatAllergyPrompt from './complex/catOwner/OwnerCatAllergyPrompt.svelte'
import ComplexOwnerCatAllergyDisplayPrompt from './complex/catOwner/OwnerCatAllergyDisplayPrompt.svelte'
import ComplexOwnerCatMicrochipServicePrompt from './complex/catOwner/OwnerCatMicrochipServicePrompt.svelte'
import ComplexOwnerCatMicrochipServiceDisplayPrompt from './complex/catOwner/OwnerCatMicrochipServiceDisplayPrompt.svelte'
import ComplexChildrenConfig from './complex/children/ChildrenConfig.svelte'
import ComplexChildrenPrompt from './complex/children/ChildrenPrompt.svelte'
import ComplexChildrenDisplayPrompt from './complex/children/ChildrenDisplayPrompt.svelte'
import ComplexReviewApplicantResidenceInfoPrompt from './complex/residence/ReviewApplicantResidenceInfoPrompt.svelte'
import ComplexReviewApplicantResidenceInfoPromptDisplay from './complex/residence/ReviewApplicantResidenceInfoPromptDisplay.svelte'
import ComplexReviewApplicantCatInfoPrompt from './complex/catOwner/ReviewApplicantCatInfoPrompt.svelte'
import ComplexReviewApplicantCatInfoPromptDisplay from './complex/catOwner/ReviewApplicantCatInfoPromptDisplay.svelte'
import ComplexReviewApplicantDogInfoPrompt from './complex/dogOwner/ReviewApplicantDogInfoPrompt.svelte'
import ComplexReviewApplicantDogInfoPromptDisplay from './complex/dogOwner/ReviewApplicantDogInfoPromptDisplay.svelte'
import ComplexReviewApplicantFosterAPetPrompt from './complex/petOwner/ReviewApplicantFosterAPetPrompt.svelte'
import ComplexReviewApplicantFosterAPetPromptDisplay from './complex/petOwner/ReviewApplicantFosterAPetPromptDisplay.svelte'
import ComplexTermsAndConditionsConfig from './complex/termsAndConditions/TermsAndConditionsConfig.svelte'
import ComplexTermsAndConditionsPrompt from './complex/termsAndConditions/TermsAndConditionsPrompt.svelte'
import ComplexTermsAndConditionsPromptDisplay from './complex/termsAndConditions/TermsAndConditionsPromptDisplay.svelte'
import ComplexApproveReviewerExerciseExemptionConfig from './complex/dogOwner/ApproveReviewerExerciseExemptionConfig.svelte'
import ComplexApproveReviewerExerciseExemptionPrompt from './complex/dogOwner/ApproveReviewerExerciseExemptionPrompt.svelte'
import ComplexApproveReviewerExerciseExemptionPromptDisplay from './complex/dogOwner/ApproveReviewerExerciseExemptionPromptDisplay.svelte'
import ComplexPreviousDogSurrenderPrompt from './complex/dogOwner/PreviousDogSurrenderPrompt.svelte'
import ComplexPreviousDogSurrenderDisplayPrompt from './complex/dogOwner/PreviousDogSurrenderDisplayPrompt.svelte'
import ComplexBridgeOfDeathPrompt from './complex/optional/BridgeOfDeathPrompt.svelte'
import ComplexBridgeOfDeathDisplayPrompt from './complex/optional/BridgeOfDeathDisplayPrompt.svelte'
import ComplexReviewMovieLoverPrompt from './complex/optional/ReviewMovieLoverPrompt.svelte'
import ComplexReviewMovieLoverDisplayPrompt from './complex/optional/ReviewMovieLoverDisplayPrompt.svelte'
import ComplexAcceptCatPrompt from './complex/catOwner/AcceptCatPrompt.svelte'
import ComplexAcceptCatDisplayPrompt from './complex/catOwner/AcceptCatDisplayPrompt.svelte'
import ComplexAcceptDogPrompt from './complex/dogOwner/AcceptDogPrompt.svelte'
import ComplexAcceptDogDisplayPrompt from './complex/dogOwner/AcceptDogDisplayPrompt.svelte'
import ComplexAcceptFosterPetPrompt from './complex/petOwner/AcceptFosterPetPrompt.svelte'
import ComplexAcceptFosterPetDisplayPrompt from './complex/petOwner/AcceptFosterPetDisplayPrompt.svelte'
import ComplexConfirmCatMircochipServicePrompt from './complex/catOwner/ConfirmCatMircochipServicePrompt.svelte'
import ComplexConfirmCatMircochipServiceDisplayPrompt from './complex/catOwner/ConfirmCatMircochipServiceDisplayPrompt.svelte'

/** RC */
import PreQualPrompt from './rc/PreQualPrompt.svelte'
import WrittenAutomatinoPrompt from './rc/WrittenAutomatinoPrompt.svelte'
import EvidenceWrittenAutomationPrompt from './rc/EvidenceWrittenAutomationPrompt.svelte'
import InvestigatedFutureCareerPrompt from './rc/InvestigatedFutureCareerPrompt.svelte'
import RateFutureCareerPrompt from './rc/RateFutureCareerPrompt.svelte'
import DataRelatedPuzzle from './rc/DataRelatedPuzzle.svelte'
import AssessDataRelatedPuzzle from './rc/AssessDataRelatedPuzzle.svelte'
import OutsideClassExample from './rc/OutsideClassExample.svelte'
import AssessOutsideClassExample from './rc/AssessOutsideClassExample.svelte'
import CriticalThinking from './rc/CriticalThinking.svelte'
import AssessCriticalThinking from './rc/AssessCriticalThinking.svelte'
import Communication from './rc/Communication.svelte'
import AssessCommunication from './rc/AssessCommunication.svelte'
import AssessAttentionDetail from './rc/AssessAttentionDetail.svelte'
import Organization from './rc/Organization.svelte'
import AssessOrganization from './rc/AssessOrganization.svelte'
import CommunicationDisplay from './rc/CommunicationDisplay.svelte'
import TechnicalTroubleshooting from './rc/TechnicalTroubleshooting.svelte'
import AssessTechnicalTroubleshooting from './rc/AssessTechnicalTroubleshooting.svelte'
import SupportCommunication from './rc/SupportCommunication.svelte'
import AssessSupportCommunication from './rc/AssessSupportCommunication.svelte'
import MaintainSysDocumentation from './rc/MaintainSysDocumentation.svelte'
import AssessMaintainSysDocumentation from './rc/AssessMaintainSysDocumentation.svelte'
import ReccomendationLetter from './rc/ReccomendationLetter.svelte'
import AssessReccomendationLetter from './rc/AssessReccomendationLetter.svelte'
import VerifyReccomendationLetter from './rc/VerifyReccomendationLetter.svelte'
import PreQualDisplay from './rc/PreQualDisplay.svelte'
import WrittenAutomationDisplay from './rc/WrittenAutomationDisplay.svelte'
import EvidenceWrittenAutomationDisplay from './rc/EvidenceWrittenAutomationDisplay.svelte'
import InvestigatedFutureCareerDisplay from './rc/InvestigatedFutureCareerDisplay.svelte'
import RateFutureCareerDisplay from './rc/RateFutureCareerDisplay.svelte'
import AssessDataRelatedPuzzleDisplay from './rc/AssessDataRelatedPuzzleDisplay.svelte'
import OutsideClassExampleDisplay from './rc/OutsideClassExampleDisplay.svelte'
import AssessOutsideClassExampleDisplay from './rc/AssessOutsideClassExampleDisplay.svelte'
import CriticalThinkingDisplay from './rc/CriticalThinkingDisplay.svelte'
import AssessCriticalThinkingDisplay from './rc/AssessCriticalThinkingDisplay.svelte'
import AssessCommunicationDisplay from './rc/AssessCommunicationDisplay.svelte'
import AssessAttentionDetailDisplay from './rc/AssessAttentionDetailDisplay.svelte'
import OrganizationDisplay from './rc/OrganizationDisplay.svelte'
import AssessOrganizationDisplay from './rc/AssessOrganizationDisplay.svelte'
import TechnicalTroubleshootingDisplay from './rc/TechnicalTroubleshootingDisplay.svelte'
import AssessTechnicalTroubleshootingDisplay from './rc/AssessTechnicalTroubleshootingDisplay.svelte'
import SupportCommunicationDisplay from './rc/SupportCommunicationDisplay.svelte'
import AssessSupportCommunicationDisplay from './rc/AssessSupportCommunicationDisplay.svelte'
import MaintainSysDocumentationDisplay from './rc/MaintainSysDocumentationDisplay.svelte'
import AssessMaintainSysDocumentationDisplay from './rc/AssessMaintainSysDocumentationDisplay.svelte'
import ReccomendationLetterDisplay from './rc/ReccomendationLetterDisplay.svelte'
import AssessReccomendationLetterDisplay from './rc/AssessReccomendationLetterDisplay.svelte'
import VerifyReccomendationLetterDisplay from './rc/VerifyReccomendationLetterDisplay.svelte'
import DataRelatedPuzzleDisplay from './rc/DataRelatedPuzzleDisplay.svelte'
import RCPreQualUserInfoPrompt from './rc/PreQualUserInfoPrompt.svelte'
import RCPreQualUserInfoPromptDisplay from './rc/PreQualUserInfoPromptDisplay.svelte'
import OptOut from './rc/OptOut.svelte'
import OptOutDisplay from './rc/OptOutDisplay.svelte'
import RCIntroPanelDefaultSlot from './rc/IntroPanelDefaultSlot.svelte'
import RCAuditSoftwareDevelopmentRegular from './rc/AuditSoftwareDevelopmentRegular.svelte'
import RCAuditSoftwareDevelopmentRegularDisplay from './rc/AuditSoftwareDevelopmentRegularDisplay.svelte'
import RCAuditSoftwareDevelopmentSubmitted from './rc/AuditSoftwareDevelopmentSubmitted.svelte'
import RCAuditSoftwareDevelopmentSubmittedDisplay from './rc/AuditSoftwareDevelopmentSubmittedDisplay.svelte'
import RCAuditSoftwareDevelopmentSubmitted2 from './rc/AuditSoftwareDevelopmentSubmitted2.svelte'
import RCAuditSoftwareDevelopmentSubmittedDisplay2 from './rc/AuditSoftwareDevelopmentSubmittedDisplay2.svelte'
import RCReviewerSoftwareDevelopmentSecondEyes from './rc/ReviewerSoftwareDevelopmentSecondEyes.svelte'
import RCReviewerSoftwareDevelopmentSecondEyesDisplay from './rc/ReviewerSoftwareDevelopmentSecondEyesDisplay.svelte'
import RCAuditSoftwareDevelopmentRegular2 from './rc/AuditSoftwareDevelopmentRegular2.svelte'
import RCAuditSoftwareDevelopmentRegularDisplay2 from './rc/AuditSoftwareDevelopmentRegularDisplay2.svelte'
import RCOverrideGPAWarning from './rc/OverrideGPAWarning.svelte'
import RCOverrideGPAWarningDisplay from './rc/OverrideGPAWarningDisplay.svelte'
import RCHelpDeskWeekendAvailability from './rc/HelpDeskWeekendAvailability.svelte'
import RCHelpDeskWeekendAvailabilityDisplay from './rc/HelpDeskWeekendAvailabilityDisplay.svelte'
import RCHelpDeskCustomerService from './rc/HelpDeskCustomerService.svelte'
import RCHelpDeskCustomerServiceDisplay from './rc/HelpDeskCustomerServiceDisplay.svelte'

import { api } from '$internal/api'
import ApplicantPromptSkeleton from '$internal/components/ApplicantPromptSkeleton.svelte'
import { GeneralTextSkeleton } from '@txstate-mws/carbon-svelte'

const { appName, applicantDashboardIntroHeader, applicantDashboardIntroDetail, applicantDashboardRecentDays, applicantPromptPage, applicantPrograms, applicantReview, programs, requirements, prompts, userLookup, slots, profileLinks } = configureDemoInstanceParams()

export const uiRegistry = new UIRegistry({
  appName,
  applicantDashboardIntroHeader,
  applicantDashboardIntroDetail,
  applicantDashboardRecentDays,
  applicantPromptPage,
  applicantPrograms,
  applicantReview,
  programs,
  requirements,
  prompts,
  userLookup,
  slots,
  profileLinks
})

function configureDemoInstanceParams (): AnyUIConfig {
  /**
   * So here's a fun hack. PUBLIC_DEMO_INSTANCE is one of our environment variables, but we
   * have a bit of a custom system for injecting environment at startup time rather than build time.
   *
   * So at build time, PUBLIC_DEMO_INSTANCE is set to '$PUBLIC_DEMO_INSTANCE' (literally). At container
   * startup, our apply-env.sh script replaces that with the actual value we want.
   *
   * The catch is, vite/rollup looks for dead code during build, and at build, it can clearly see that
   * PUBLIC_DEMO_INSTANCE is a constant string '$PUBLIC_DEMO_INSTANCE', so any conditional branches
   * depending on its value are optimized away. To avoid that, we do a little string manipulation
   * here to prevent vite/rollup from being able to tell what the value is at build time.
   */
  let tmpDemoInstance = `${PUBLIC_DEMO_INSTANCE}`
  tmpDemoInstance = tmpDemoInstance.trim()
  if (tmpDemoInstance === 'simple') {
    return {
      appName: 'Adopt a Pet',
      applicantDashboardIntroHeader: 'Start your Pet Journey Here!',
      applicantDashboardIntroDetail: 'Submitting an adoption application is the first step in adopting a pet. Based on your responses you will receive a list of "eligible benefits."',
      applicantDashboardRecentDays: 30,
      programs: {
        adopt_a_pet_program: { icon: DogWalker },
        thanks_or_no_thanks_program: { icon: Gamification },
      },
      userLookup: async (login) => {
        const accessUser = await api.getAccessUser(login)
        if (!accessUser) return
        const userProfileName = [accessUser?.fullname.slice(0, accessUser?.fullname.indexOf(' ')), accessUser?.fullname.slice(accessUser?.fullname.indexOf(' ') + 1)]
        return { firstName: userProfileName[0], lastName: userProfileName[1], username: login }
      },
      requirements: {
        state_residence_req: { configureComponent: ResidenceConfig },
        state_residence_confirmation_req: {},
        step1_post_residence_req: {},
        step3_post_residence_req: {},
        id_type_req: {},
      },
      prompts: {
        state_residence_prompt: { formComponent: ResidencePrompt, displayComponent: ResidencePromptDisplay },
        state_residence_confirmation_prompt: { formComponent: ResidenceConfirmationReviewPrompt, displayComponent: ResidenceConfirmationReviewPromptDisplay },
        step1_post_residence_prompt: { formComponent: Step1PostResidencePrompt, displayComponent: Step1PostResidencePromptDisplay },
        step2_post_residence_prompt: { formComponent: Step2PostResidencePrompt, displayComponent: Step2PostResidencePromptDisplay },
        step3_post_residence_prompt: { formComponent: Step3PostResidencePrompt, displayComponent: Step3PostResidencePromptDisplay },
        thanks_or_no_thanks_prompt: { formComponent: ThanksOrNoThanksPrompt, displayComponent: ThanksOrNoThanksPromptDisplay },
        id_values_prompt: { formComponent: IDValuesPrompt, displayComponent: IDValuesPromptDisplay },
        id_values_extra_data_prompt: { formComponent: IDValuesExtraDataPrompt, displayComponent: IDValuesExtraDataPromptDisplay },
        ssn_value_prompt: { formComponent: SSNValuePrompt, displayComponent: SSNValuePromptDisplay },
      }
    } satisfies UIConfig<SimplePromptKey, SimpleRequirementKey, SimpleProgramKey>
  } else if (tmpDemoInstance === 'multi') { // TODO - Update one spec for multi complete, currently mirror demo
    return {
      appName: 'Adopt a Critter',
      applicantDashboardIntroHeader: 'Start your Pet Journey Here!',
      applicantDashboardIntroDetail: 'Submitting an adoption application is the first step in adopting a cat or dog. Based on your responses you will receive a list of "eligible benefits."',
      applicantDashboardRecentDays: 30,
      userLookup: async (login) => {
        const accessUser = await api.getAccessUser(login)
        if (!accessUser) return
        const userProfileName = [accessUser?.fullname.slice(0, accessUser?.fullname.indexOf(' ')), accessUser?.fullname.slice(accessUser?.fullname.indexOf(' ') + 1)]
        return { firstName: userProfileName[0], lastName: userProfileName[1], username: login }
      },
      programs: {
        adopt_a_dog_program: { icon: DogWalker },
        // The reviewer's vaccine check belongs right under the applicant's answer about their other cats,
        // so the two share a panel, placed after the default applicant panels. `applicant_seems_nice_req`
        // is not placed, so it falls into the default "Reviewer Questions" panel that trails the list.
        adopt_a_cat_program: {
          reviewSections: [
            { section: 'GENERAL' },
            { section: 'PROGRAM' },
            { title: 'Other cats in the home', requirementKeys: ['other_cats_applicant_req', 'other_cats_reviewer_req'] }
          ]
        },
      },
      requirements: {
        have_big_yard_req: {},
        have_adequate_personal_space_req: {},
        have_a_cat_tower_req: {},
        not_allergic_to_tuna_req: {},
        applicant_seems_nice_req: {},
        must_exercise_your_dog_req: { configureComponent: ExerciseConfigure },
        which_state_req: {},
        other_cats_applicant_req: {},
        other_cats_reviewer_req: {},
      },
      prompts: {
        have_yard_prompt: { formComponent: YardPrompt, displayComponent: YardPromptDisplay },
        have_a_cat_tower_prompt: { formComponent: CatTowerPrompt, displayComponent: CatTowerPromptDisplay },
        not_allergic_to_tuna_prompt: { formComponent: TunaAllergyPrompt, displayComponent: TunaAllergyPromptDisplay },
        applicant_seems_nice_prompt: { formComponent: SeemsNicePrompt, displayComponent: SeemsNicePromptDisplay },
        must_exercise_your_dog_prompt: { formComponent: ExercisePrompt, displayComponent: ExercisePromptDisplay },
        which_state_prompt: { formComponent: StatePrompt, displayComponent: StatePromptDisplay },
        other_cats_prompt: { formComponent: OtherCatsPrompt, displayComponent: OtherCatsPromptDisplay },
        other_cats_vaccines_prompt: { formComponent: OtherCatsVaccinesPrompt, displayComponent: OtherCatsVaccinesPromptDisplay },
        vaccine_review_prompt: { formComponent: VaccineReviewPrompt, displayComponent: VaccineReviewPromptDisplay },
      }
    } satisfies UIConfig<DefaultPromptKey, DefaultRequirementKey, DefaultProgramKey>
  } else if (tmpDemoInstance === 'complex') {
    return {
      appName: 'Pet lover',
      applicantDashboardIntroHeader: 'Keep your love of pets alive!',
      applicantDashboardIntroDetail: 'Submitting an application is the first step in making the life of a pet better! Based on your responses you will receive a list of "eligible benefits."',
      applicantDashboardRecentDays: 30,
      userLookup: async (login) => {
        const accessUser = await api.getAccessUser(login)
        if (!accessUser) return
        const userProfileName = [accessUser?.fullname.slice(0, accessUser?.fullname.indexOf(' ')), accessUser?.fullname.slice(accessUser?.fullname.indexOf(' ') + 1)]
        return { firstName: userProfileName[0], lastName: userProfileName[1], username: login }
      },
      programs: {
        adopt_a_dog_program: { icon: DogWalker },
        adopt_a_cat_program: { icon: PedestrianFamily },
        foster_a_pet_program: { icon: Gamification },
      },
      requirements: {
        state_residence_prequal_req: { configureComponent: ComplexResidenceConfig },
        petowner_prequal_req: {},
        previous_dogowner_qual_req: {},
        current_dogowner_qual_req: { configureComponent: ComplexCurrentDogConfig },
        yard_qual_req: { configureComponent: ComplexYardConfig },
        owner_dog_allergy_qual_req: {},
        dog_exercise_qual_req: { configureComponent: ComplexDogExerciseConfig },
        previous_catowner_qual_req: {},
        current_catowner_qual_req: { configureComponent: ComplexCurrentCatConfig },
        living_space_qual_req: { configureComponent: ComplexLivingSpaceConfig },
        owner_cat_allergy_qual_req: {},
        owner_cat_microchip_service_qual_req: {},
        children_qual_req: { configureComponent: ComplexChildrenConfig },
        movie_lover_qual_req: {},
        terms_and_conditions_post_qual_req: {},
        review_applicant_state_residence_app_req: {},
        review_applicant_cat_info_app_req: {},
        review_applicant_dog_info_app_req: {},
        review_applicant_foster_a_pet_info_app_req: {},
        review_movie_lover_app_req: {},
        previous_dog_surrender_qual_req: {},
        previous_dog_surrender_foster_qual_req: {},
        approve_reviewer_exercise_exemption_workflow_req: { configureComponent: ComplexApproveReviewerExerciseExemptionConfig },
        accept_adopt_cat_req: {},
        accept_adopt_dog_req: {},
        accept_fost_pet_req: {},
        confirm_cat_microchip_service_workflow_req: {},
      },
      prompts: {
        state_residence_prompt: { formComponent: ComplexResidencePrompt, displayComponent: ComplexResidenceDisplayPrompt },
        petowner_prompt: { formComponent: ComplexPetOwnerPrompt, displayComponent: ComplexPetOwnerDisplayPrompt },
        previous_dogowner_prompt: { formComponent: ComplexPreviousDogOwnerPrompt, displayComponent: ComplexPreviousDogOwnerDisplayPrompt },
        current_dogowner_prompt: { formComponent: ComplexCurrentDogOwnerPrompt, displayComponent: ComplexCurrentDogOwnerDisplayPrompt },
        yard_prompt: { formComponent: ComplexYardPrompt, displayComponent: ComplexYardDisplayPrompt },
        owner_dog_allergy_prompt: { formComponent: ComplexOwnerDogAllergyPrompt, displayComponent: ComplexOwnerDogAllergyDisplayPrompt },
        dog_exercise_prompt: { formComponent: ComplexDogExercisePrompt, displayComponent: ComplexDogExerciseDisplayPrompt },
        previous_catowner_prompt: { formComponent: ComplexPreviousCatOwnerPrompt, displayComponent: ComplexPreviousCatOwnerDisplayPrompt },
        current_catowner_prompt: { formComponent: ComplexCurrentCatOwnerPrompt, displayComponent: ComplexCurrentCatOwnerDisplayPrompt },
        living_space_prompt: { formComponent: ComplexLivingSpacePrompt, displayComponent: ComplexLivingSpaceDisplayPrompt },
        owner_cat_allergy_prompt: { formComponent: ComplexOwnerCatAllergyPrompt, displayComponent: ComplexOwnerCatAllergyDisplayPrompt },
        owner_cat_microchip_service_prompt: { formComponent: ComplexOwnerCatMicrochipServicePrompt, displayComponent: ComplexOwnerCatMicrochipServiceDisplayPrompt },
        children_prompt: { formComponent: ComplexChildrenPrompt, displayComponent: ComplexChildrenDisplayPrompt },
        bridge_of_death_prompt: { formComponent: ComplexBridgeOfDeathPrompt, displayComponent: ComplexBridgeOfDeathDisplayPrompt },
        review_applicant_state_residence_info_prompt: { formComponent: ComplexReviewApplicantResidenceInfoPrompt, displayComponent: ComplexReviewApplicantResidenceInfoPromptDisplay },
        review_applicant_cat_info_prompt: { formComponent: ComplexReviewApplicantCatInfoPrompt, displayComponent: ComplexReviewApplicantCatInfoPromptDisplay },
        review_applicant_dog_info_prompt: { formComponent: ComplexReviewApplicantDogInfoPrompt, displayComponent: ComplexReviewApplicantDogInfoPromptDisplay },
        review_applicant_foster_a_pet_info_prompt: { formComponent: ComplexReviewApplicantFosterAPetPrompt, displayComponent: ComplexReviewApplicantFosterAPetPromptDisplay },
        review_movie_lover_answers_prompt: { formComponent: ComplexReviewMovieLoverPrompt, displayComponent: ComplexReviewMovieLoverDisplayPrompt },
        terms_and_conditions_prompt: { configureComponent: ComplexTermsAndConditionsConfig, formComponent: ComplexTermsAndConditionsPrompt, displayComponent: ComplexTermsAndConditionsPromptDisplay },
        previous_dog_surrender_prompt: { formComponent: ComplexPreviousDogSurrenderPrompt, displayComponent: ComplexPreviousDogSurrenderDisplayPrompt },
        previous_dog_surrender_foster_prompt: { formComponent: ComplexPreviousDogSurrenderPrompt, displayComponent: ComplexPreviousDogSurrenderDisplayPrompt },
        approve_reviewer_exercise_exemption_prompt: { formComponent: ComplexApproveReviewerExerciseExemptionPrompt, displayComponent: ComplexApproveReviewerExerciseExemptionPromptDisplay },
        accept_cat_prompt: { formComponent: ComplexAcceptCatPrompt, displayComponent: ComplexAcceptCatDisplayPrompt },
        accept_dog_prompt: { formComponent: ComplexAcceptDogPrompt, displayComponent: ComplexAcceptDogDisplayPrompt },
        accept_foster_pet_prompt: { formComponent: ComplexAcceptFosterPetPrompt, displayComponent: ComplexAcceptFosterPetDisplayPrompt },
        confirm_cat_microchip_service_prompt: { formComponent: ComplexConfirmCatMircochipServicePrompt, displayComponent: ComplexConfirmCatMircochipServiceDisplayPrompt },
      }
    } satisfies UIConfig<ComplexPromptKey, ComplexRequirementKey, ComplexProgramKey>
  } else if (tmpDemoInstance === 'rc') {
    return {
      appName: 'MWS Technical Mentorship Experience',
      applicantDashboardIntroHeader: 'Apply for a technical mentorship here!',
      applicantDashboardIntroDetail: 'After applying for a mentorship, eligibilty will be determined based on your responses',
      applicantPromptPage: {
        formClass: 'max-w-[800px] mx-auto',
        invalidatedInlineNotificationClass: 'w-full mx-auto'
      },
      applicantReview: {
        title: 'Review your technical mentorship application',
        subTitle: 'Confirm the technical mentorship benefits shown are the ones you are requesting and that your responses are correct, or make changes before submitting.'
      },
      applicantDashboardRecentDays: 30,
      slots: {
        applicantDashboardIntroSlot: RCIntroPanelDefaultSlot
      },
      profileLinks: [
        { label: 'Help', href: 'https://itac.txst.edu/contact.html', external: true }
      ],
      userLookup: async (login) => {
        const accessUser = await api.getAccessUser(login)
        if (!accessUser) return
        const userProfileName = [accessUser?.fullname.slice(0, accessUser?.fullname.indexOf(' ')), accessUser?.fullname.slice(accessUser?.fullname.indexOf(' ') + 1)]
        return { firstName: userProfileName[0], lastName: userProfileName[1], username: login }
      },
      programs: {
        operations_infrastructure: {
          icon: DogWalker,
          reviewSections: [
            { section: 'GENERAL' },
            { section: 'PROGRAM' },
            {
              title: 'Assessments',
              requirementKeys: [
                'written_automation_req', 'evidence_automation_req',
                'investigated_future_career_req', 'rate_future_career_req',
                'reccomendation_letter_req', 'assess_reccomendation_lettern_req'
              ]
            }
          ]
        },
        software_development: {
          icon: DogWalker,
          reviewSections: [
            { section: 'GENERAL' },
            { workflowStage: 'override_gpa_warning' },
            {
              title: 'Assessments',
              requirementKeys: [
                'data_related_puzzle_req', 'assess_data_related_puzzle_req',
                'outside_class_example_req', 'assess_outside_class_example_req',
                'critical_thinking_req', 'assess_critical_thinking_req',
                'reccomendation_letter_req', 'assess_reccomendation_lettern_req',
                'verify_reccomendation_letter_req'
              ]
            },
            { section: 'REVIEWER' }
          ]
        },
        // no layout, so it shows the default type-based panels
        project_management: { icon: DogWalker },
        application_management_support: {
          icon: DogWalker,
          reviewSections: [
            { section: 'GENERAL' },
            { section: 'PROGRAM' },
            {
              title: 'Assessments',
              requirementKeys: [
                'technical_troubleshooting_req', 'assess_technical_troubleshootingn_req',
                'support_communication_req', 'assess_support_communicationn_req',
                'maintain_sys_documentation_req', 'assess_maintain_sys_documentation_req',
                'reccomendation_letter_req', 'assess_reccomendation_lettern_req'
              ]
            }
          ]
        },
        // no layout, so it shows the default type-based panels
        help_desk_associate: { icon: DogWalker },
      },
      requirements: {
        step1_prequal_req: {},
        written_automation_req: {},
        evidence_automation_req: {},
        investigated_future_career_req: {},
        rate_future_career_req: {},
        data_related_puzzle_req: {},
        assess_data_related_puzzle_req: {},
        outside_class_example_req: {},
        assess_outside_class_example_req: {},
        critical_thinking_req: {},
        assess_critical_thinking_req: {},
        communication_req: {},
        assess_communicationn_req: {},
        assess_attention_detail_req: {},
        organization_req: {},
        assess_organization_req: {},
        reccomendation_letter_req: {},
        assess_reccomendation_lettern_req: {},
        verify_reccomendation_letter_req: {},
        audit_software_development_non_blocking_show_submitted_req: {},
        audit_software_development_non_blocking_show_submitted_req2: {},
        audit_software_development_non_blocking_show_regular_req: {},
        audit_software_development_non_blocking_show_regular_req2: {},
        reviewer_software_development_second_eyes_req: {},
        reviewer_override_gpa_warning_req: {},
        help_desk_opt_out_req: {},
        help_desk_weekend_availability_req: {},
        help_desk_customer_service_req: {},
      },
      prompts: {
        pre_qual_prompt: { formComponent: PreQualPrompt, displayComponent: PreQualDisplay, displayMode: 'large' },
        pre_qual_user_info_prompt: { formComponent: RCPreQualUserInfoPrompt, displayComponent: RCPreQualUserInfoPromptDisplay },
        written_automation_prompt: { formComponent: WrittenAutomatinoPrompt, displayComponent: WrittenAutomationDisplay },
        evidence_automation_prompt: { formComponent: EvidenceWrittenAutomationPrompt, displayComponent: EvidenceWrittenAutomationDisplay },
        investigated_future_career_prompt: { formComponent: InvestigatedFutureCareerPrompt, displayComponent: InvestigatedFutureCareerDisplay },
        rate_future_career_prompt: { formComponent: RateFutureCareerPrompt, displayComponent: RateFutureCareerDisplay },
        data_related_puzzle_prompt: { formComponent: DataRelatedPuzzle, displayComponent: DataRelatedPuzzleDisplay, loader: true },
        assess_data_related_puzzle_prompt: { formComponent: AssessDataRelatedPuzzle, displayComponent: AssessDataRelatedPuzzleDisplay },
        outside_class_example_prompt: { formComponent: OutsideClassExample, displayComponent: OutsideClassExampleDisplay, applicantPromptPage: { formClass: 'max-w-[500px] mx-auto' } },
        assess_outside_class_example_prompt: { formComponent: AssessOutsideClassExample, displayComponent: AssessOutsideClassExampleDisplay },
        critical_thinking_prompt: { formComponent: CriticalThinking, displayComponent: CriticalThinkingDisplay, applicantPromptPage: { invalidatedInlineNotificationClass: 'max-w-[400px] mx-auto' } },
        assess_critical_thinking_prompt: { formComponent: AssessCriticalThinking, displayComponent: AssessCriticalThinkingDisplay },
        communication_prompt: { formComponent: Communication, displayComponent: CommunicationDisplay, loader: { skeletonComponent: ApplicantPromptSkeleton } },
        assess_communication_prompt: { formComponent: AssessCommunication, displayComponent: AssessCommunicationDisplay },
        assess_attention_detail_prompt: { formComponent: AssessAttentionDetail, displayComponent: AssessAttentionDetailDisplay },
        organization_prompt: { formComponent: Organization, displayComponent: OrganizationDisplay },
        assess_organization_prompt: { formComponent: AssessOrganization, displayComponent: AssessOrganizationDisplay },
        technical_troubleshooting_prompt: { formComponent: TechnicalTroubleshooting, displayComponent: TechnicalTroubleshootingDisplay },
        assess_technical_troubleshooting_prompt: { formComponent: AssessTechnicalTroubleshooting, displayComponent: AssessTechnicalTroubleshootingDisplay, formMode: 'full', loader: { skeletonComponent: GeneralTextSkeleton } },
        support_communication_prompt: { formComponent: SupportCommunication, displayComponent: SupportCommunicationDisplay },
        assess_support_communication_prompt: { formComponent: AssessSupportCommunication, displayComponent: AssessSupportCommunicationDisplay },
        maintain_sys_documentation_prompt: { formComponent: MaintainSysDocumentation, displayComponent: MaintainSysDocumentationDisplay },
        assess_maintain_sys_documentation_prompt: { formComponent: AssessMaintainSysDocumentation, displayComponent: AssessMaintainSysDocumentationDisplay },
        reccomendation_letter_prompt: { formComponent: ReccomendationLetter, displayComponent: ReccomendationLetterDisplay },
        assess_reccomendation_letter_prompt: { formComponent: AssessReccomendationLetter, displayComponent: AssessReccomendationLetterDisplay },
        verify_reccomendation_letter_prompt: { formComponent: VerifyReccomendationLetter, displayComponent: VerifyReccomendationLetterDisplay, formMode: 'full', displayMode: 'large', reviewerDialogButtonText: 'Review recommendation letter' },
        software_dev_opt_out_prompt: { formComponent: OptOut, displayComponent: OptOutDisplay },
        application_management_opt_out_prompt: { formComponent: OptOut, displayComponent: OptOutDisplay },
        operations_infrastructure_opt_out_prompt: { formComponent: OptOut, displayComponent: OptOutDisplay },
        project_management_opt_out_prompt: { formComponent: OptOut, displayComponent: OptOutDisplay },
        audit_software_development_non_blocking_show_submitted_prompt: { formComponent: RCAuditSoftwareDevelopmentSubmitted, displayComponent: RCAuditSoftwareDevelopmentSubmittedDisplay },
        audit_software_development_non_blocking_show_submitted_prompt2: { formComponent: RCAuditSoftwareDevelopmentSubmitted2, displayComponent: RCAuditSoftwareDevelopmentSubmittedDisplay2 },
        audit_software_development_non_blocking_show_regular_prompt: { formComponent: RCAuditSoftwareDevelopmentRegular, displayComponent: RCAuditSoftwareDevelopmentRegularDisplay },
        audit_software_development_non_blocking_show_regular_prompt2: { formComponent: RCAuditSoftwareDevelopmentRegular2, displayComponent: RCAuditSoftwareDevelopmentRegularDisplay2 },
        reviewer_software_development_second_eyes_prompt: { formComponent: RCReviewerSoftwareDevelopmentSecondEyes, displayComponent: RCReviewerSoftwareDevelopmentSecondEyesDisplay },
        reviewer_override_gpa_warning_prompt: { formComponent: RCOverrideGPAWarning, displayComponent: RCOverrideGPAWarningDisplay },
        help_desk_opt_out_prompt: { formComponent: OptOut, displayComponent: OptOutDisplay },
        help_desk_weekend_availability_prompt: { formComponent: RCHelpDeskWeekendAvailability, displayComponent: RCHelpDeskWeekendAvailabilityDisplay },
        help_desk_customer_service_prompt: { formComponent: RCHelpDeskCustomerService, displayComponent: RCHelpDeskCustomerServiceDisplay },
      }
    } satisfies UIConfig<RcPromptKey, RcRequirementKey, RcProgramKey>
  }
  return {
    appName: 'Adopt a Critter',
    applicantDashboardIntroHeader: 'Start your Pet Journey Here!',
    applicantDashboardIntroDetail: 'Submitting an adoption application is the first step in adopting a cat or dog. Based on your responses you will receive a list of "eligible benefits."',
    applicantDashboardRecentDays: 30,
    applicantPrograms: {
      title: 'Critters you may adopt',
      ineligibleTitle: 'Critters you cannot adopt yet'
    },
    applicantReview: {
      title: 'Review your critter application',
      subTitle: 'Confirm the critter benefits shown are the ones you are requesting and that your responses are correct, or make changes before submitting.',
      ineligibleTitle: 'Critters not included in this application'
    },
    slots: {
      applicantDashboardIntroSlot: DefaultIntroPanelDefaultSlot
    },
    userLookup: async (login) => {
      const accessUser = await api.getAccessUser(login)
      if (!accessUser) return
      const userProfileName = [accessUser?.fullname.slice(0, accessUser?.fullname.indexOf(' ')), accessUser?.fullname.slice(accessUser?.fullname.indexOf(' ') + 1)]
      return { firstName: userProfileName[0], lastName: userProfileName[1], username: login }
    },
    programs: {
      adopt_a_dog_program: { icon: DogWalker },
      // The reviewer's vaccine check belongs right under the applicant's answer about their other cats,
      // so the two share a panel, placed after the default applicant panels. `applicant_seems_nice_req`
      // is not placed, so it falls into the default "Reviewer Questions" panel that trails the list.
      adopt_a_cat_program: {
        reviewSections: [
          { section: 'GENERAL' },
          { section: 'PROGRAM' },
          { title: 'Other cats in the home', requirementKeys: ['other_cats_applicant_req', 'other_cats_reviewer_req'] }
        ]
      },
    },
    requirements: {
      have_big_yard_req: {},
      have_adequate_personal_space_req: {},
      have_a_cat_tower_req: {},
      not_allergic_to_tuna_req: {},
      applicant_seems_nice_req: {},
      must_exercise_your_dog_req: { configureComponent: ExerciseConfigure },
      which_state_req: {},
      other_cats_applicant_req: {},
      other_cats_reviewer_req: {},
    },
    prompts: {
      have_yard_prompt: { formComponent: YardPrompt, displayComponent: YardPromptDisplay },
      have_a_cat_tower_prompt: { formComponent: CatTowerPrompt, displayComponent: CatTowerPromptDisplay },
      not_allergic_to_tuna_prompt: { formComponent: TunaAllergyPrompt, displayComponent: TunaAllergyPromptDisplay },
      applicant_seems_nice_prompt: { formComponent: SeemsNicePrompt, displayComponent: SeemsNicePromptDisplay },
      must_exercise_your_dog_prompt: { formComponent: ExercisePrompt, displayComponent: ExercisePromptDisplay },
      which_state_prompt: { formComponent: StatePrompt, displayComponent: StatePromptDisplay },
      other_cats_prompt: { formComponent: OtherCatsPrompt, displayComponent: OtherCatsPromptDisplay },
      other_cats_vaccines_prompt: { formComponent: OtherCatsVaccinesPrompt, displayComponent: OtherCatsVaccinesPromptDisplay },
      vaccine_review_prompt: { formComponent: VaccineReviewPrompt, displayComponent: VaccineReviewPromptDisplay },
    }
  } satisfies UIConfig<DefaultPromptKey, DefaultRequirementKey, DefaultProgramKey>
}
