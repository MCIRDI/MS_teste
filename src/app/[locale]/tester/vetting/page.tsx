import { getTranslations } from "next-intl/server";

import { hasPassedVetting, requireSession } from "@/lib/auth";

import { prisma } from "@/lib/prisma";

import { canRetryVetting, vettingQuestions } from "@/lib/vetting";

import { submitVettingAction } from "@/app/actions/vetting";

import { Button } from "@/components/ui/button";

import { Card, CardDescription, CardHeader, CardSection, CardTitle } from "@/components/ui/card";

import { SectionHeading } from "@/components/sections/section-heading";

import { VettingPassedModal } from "@/components/tester/vetting-passed-modal";



export default async function TesterVettingPage({

  searchParams,

}: {

  searchParams: Promise<{ result?: string; score?: string }>;

}) {

  const session = await requireSession(["TESTER"]);

  const { result, score } = await searchParams;

  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.id } });

  const t = await getTranslations("tester.vettingPassedModal");



  if (user.accountStatus === "ACTIVE") {

    return (

      <div className="space-y-4">

        <SectionHeading

          eyebrow="Vetting"

          title="Account active"

          description="Your account is already approved. You can access campaigns from your dashboard."

        />

      </div>

    );

  }



  const passedVetting = hasPassedVetting(user.vetingScore);

  const canRetry = canRetryVetting(user.vetingRetryDate);



  if (passedVetting) {

    const displayScore = score ? Number(score) : (user.vetingScore ?? 0);

    return (

      <div className="mx-auto max-w-3xl space-y-6">

        <SectionHeading

          eyebrow="Vetting"

          title="Evaluation submitted"

          description="Your quiz has been recorded. An administrator will review your profile."

        />

        <Card variant="muted">

          <CardSection>

            <p className="text-sm text-emerald-800">

              Score: <strong>{user.vetingScore}%</strong>. Your account is pending administrator

              approval. You will be able to sign in again once your account is activated.

            </p>

          </CardSection>

        </Card>

        {result === "passed" ? (

          <VettingPassedModal score={displayScore} t={{
            title: t("title"),
            scoreLabel: t("scoreLabel"),
            message: t("message"),
            confirm: t("confirm"),
            confirming: t("confirming"),
          }} />

        ) : null}

      </div>

    );

  }



  return (

    <div className="mx-auto max-w-3xl space-y-6">

      <SectionHeading

        eyebrow="Vetting"

        title="Tester evaluation"

        description="Pass this short quiz to submit your profile for administrator approval."

      />



      {result === "failed" ? (

        <Card variant="muted">

          <CardSection>

            <p className="text-sm text-amber-800">

              Score: {score ?? user.vetingScore}%. Minimum required: 60%.

              {user.vetingRetryDate && !canRetry

                ? ` Retry available after ${user.vetingRetryDate.toLocaleDateString()}.`

                : " You can try again now."}

            </p>

          </CardSection>

        </Card>

      ) : null}



      {user.vetingScore !== null && user.vetingScore !== undefined && !result ? (

        <Card variant="muted">

          <CardSection>

            <p className="text-sm text-slate-700">

              Last score: <strong>{user.vetingScore}%</strong>

              {user.vetingRetryDate && !canRetry

                ? ` — retry available after ${user.vetingRetryDate.toLocaleDateString()}`

                : null}

            </p>

          </CardSection>

        </Card>

      ) : null}



      {!canRetry ? (

        <Card>

          <CardSection>

            <p className="text-sm text-amber-800">

              You must wait before retaking the evaluation.

            </p>

          </CardSection>

        </Card>

      ) : (

        <Card padding="none">

          <CardHeader>

            <CardTitle>Quiz ({vettingQuestions.length} questions)</CardTitle>

            <CardDescription>Minimum score required: 60%</CardDescription>

          </CardHeader>

          <CardSection className="border-t border-slate-100/90">

            <form action={submitVettingAction} className="space-y-6">

              {vettingQuestions.map((question, index) => (

                <fieldset key={question.id} className="space-y-2 rounded-xl border border-slate-200 p-4">

                  <legend className="px-1 text-sm font-semibold text-slate-900">

                    {index + 1}. {question.prompt}

                  </legend>

                  {question.options.map((option) => (

                    <label key={option.id} className="flex items-center gap-2 text-sm text-slate-700">

                      <input type="radio" name={question.id} value={option.id} required />

                      {option.label}

                    </label>

                  ))}

                </fieldset>

              ))}

              <Button type="submit" className="w-full">

                Submit evaluation

              </Button>

            </form>

          </CardSection>

        </Card>

      )}

    </div>

  );

}

