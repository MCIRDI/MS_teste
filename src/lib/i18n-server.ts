import { getTranslations } from "next-intl/server";

import {
  getAssignmentRoleLabels,
  getCampaignStageLabels,
  getRoleLabels,
  getSoftwareTypes,
} from "@/lib/i18n";

export async function getLocalizedLabels() {
  const t = await getTranslations();

  return {
    roleLabels: getRoleLabels(t),
    assignmentRoleLabels: getAssignmentRoleLabels(t),
    campaignStageLabels: getCampaignStageLabels(t),
    softwareTypes: getSoftwareTypes(t),
  };
}
