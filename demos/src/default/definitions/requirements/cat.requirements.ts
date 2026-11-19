import { type RequirementDefinition, RequirementStatus, RequirementType } from '@reqquest/api'
import { CatTowerPromptData, NicePromptData, OtherCatsPromptData, TunaAllergyPromptData, VaccinePromptData, VaccineReviewPromptData } from '../models/index.js'

export const cat_tower_req: RequirementDefinition = {
  type: RequirementType.QUALIFICATION,
  key: 'have_a_cat_tower_req',
  title: 'Applicant must own a cat tower',
  navTitle: 'Cat Tower',
  description: 'Applicants must own a cat tower or be willing to purchase one upon adoption.',
  promptKeys: ['have_a_cat_tower_prompt'],
  resolve: (data, config) => {
    const catTowerData = data['have_a_cat_tower_prompt'] as CatTowerPromptData
    if (catTowerData?.haveCatTower == null) return { status: RequirementStatus.PENDING }
    if (catTowerData.haveCatTower) return { status: RequirementStatus.MET }
    if (catTowerData.willPurchaseCatTower == null) return { status: RequirementStatus.PENDING }
    if (catTowerData.willPurchaseCatTower) return { status: RequirementStatus.MET }
    return {
      status: RequirementStatus.DISQUALIFYING,
      reason: 'Must own a cat tower or be willing to purchase one.',
      blame: [
        { prompt: 'have_a_cat_tower_prompt', fields: ['haveCatTower'], message: 'Adopting a cat requires a cat tower.', status: RequirementStatus.WARNING },
        { prompt: 'have_a_cat_tower_prompt', fields: ['willPurchaseCatTower'], message: 'Without a cat tower, you must agree to purchase one.' }
      ]
    }
  }
}

export const not_allergic_to_tuna_req: RequirementDefinition = {
  type: RequirementType.QUALIFICATION,
  key: 'not_allergic_to_tuna_req',
  title: 'Applicant must not be allergic to tuna',
  navTitle: 'Not Allergic to Tuna',
  description: 'Applicants must not be allergic to the smell of tuna.',
  promptKeys: ['not_allergic_to_tuna_prompt'],
  resolve: (data, config) => {
    const allergyData = data['not_allergic_to_tuna_prompt'] as TunaAllergyPromptData
    if (allergyData?.allergicToTuna == null) return { status: RequirementStatus.PENDING }
    if (allergyData.allergicToTuna) return { status: RequirementStatus.DISQUALIFYING, reason: 'Must not be allergic to tuna.' }
    return { status: RequirementStatus.MET }
  }
}

export const applicant_seems_nice_req: RequirementDefinition = {
  type: RequirementType.APPROVAL,
  key: 'applicant_seems_nice_req',
  title: 'Applicant seems nice',
  navTitle: 'Seems Nice',
  description: 'Applicant has to seem nice if we\'re going to let them have a pet.',
  promptKeys: ['applicant_seems_nice_prompt'],
  resolve: (data, config) => {
    const niceData = data['applicant_seems_nice_prompt'] as NicePromptData
    if (niceData?.seemsNice == null) return { status: RequirementStatus.PENDING }
    if (niceData.seemsNice) return { status: RequirementStatus.MET }
    return { status: RequirementStatus.DISQUALIFYING, reason: 'Applicant looks kinda mean.' }
  }
}

export const other_cats_applicant_req: RequirementDefinition<OtherCatsPromptData> = {
  key: 'other_cats_applicant_req',
  type: RequirementType.QUALIFICATION,
  title: 'Other Cats Requirement',
  description: 'If applicant has other cats, they must be vaccinated.',
  promptKeys: ['other_cats_prompt', 'other_cats_vaccines_prompt'],
  resolve: (data, config) => {
    const otherCatsData = data['other_cats_prompt'] as OtherCatsPromptData
    if (otherCatsData?.hasOtherCats == null) return { status: RequirementStatus.PENDING, reason: 'Applicant must indicate whether they have other cats.', blame: ['other_cats_prompt'] }
    if (!otherCatsData.hasOtherCats) return { status: RequirementStatus.NOT_APPLICABLE }
    const vaccinesData = data['other_cats_vaccines_prompt'] as VaccinePromptData
    if (vaccinesData?.distemperDoc && vaccinesData?.rabiesDoc && vaccinesData?.felineLeukemiaDoc && vaccinesData?.felineHIVDoc) {
      return { status: RequirementStatus.MET }
    }
    return { status: RequirementStatus.PENDING, reason: 'Applicant must provide vaccination records for their other cats.', blame: ['other_cats_vaccines_prompt'] }
  }
}

export const other_cats_reviewer_req: RequirementDefinition = {
  key: 'other_cats_reviewer_req',
  type: RequirementType.APPROVAL,
  title: 'Other Cats Reviewer Requirement',
  description: 'Reviewer must assess the vaccination records provided by the applicant.',
  promptKeys: ['other_cats_prompt', 'vaccine_review_prompt'],
  resolve: (data, config) => {
    const otherCatsData = data['other_cats_prompt'] as OtherCatsPromptData
    if (otherCatsData?.hasOtherCats === false) return { status: RequirementStatus.NOT_APPLICABLE }
    const reviewData = data['vaccine_review_prompt'] as VaccineReviewPromptData
    if (!reviewData) return { status: RequirementStatus.PENDING, reason: 'Reviewer must assess all vaccine records.', blame: ['vaccine_review_prompt'] }
    const keys: (keyof VaccineReviewPromptData)[] = ['distemper', 'rabies', 'felineLeukemia', 'felineHIV']
    for (const key of keys) {
      if (!reviewData[key]) return { status: RequirementStatus.PENDING, reason: 'Reviewer is still assessing vaccine records.', blame: ['vaccine_review_prompt'] }
      if (!reviewData[key]!.satisfactory) return { status: RequirementStatus.DISQUALIFYING, reason: `The ${key} vaccine record is unsatisfactory.`, blame: ['other_cats_vaccines_prompt'] }
    }
    return { status: RequirementStatus.MET }
  }
}
