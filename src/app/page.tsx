export const dynamic = 'force-dynamic'
import LinkComponent from "@/components/common/LinkComponent";
import { Button } from "@/components/ui/button";
import SignOutBtnInHome from "@/components/use-case/sign-out-button-in-home/SignOutBtnInHome";
import { baseEndPoint } from "./actions/general";
import { getMeAction } from "./actions/users";
import { getMyAssignmentsSummaryAction } from "./actions/assessments";
import { Building2, CircleCheckBig, CircleDashed, CirclePlay } from "lucide-react";

type AssignmentsSummary = {
  totalCharities: number;
  notStarted: number;
  inProgress: number;
  completed: number;
}

const STAT_CARDS: Array<{
  key: keyof AssignmentsSummary;
  label: string;
  icon: typeof Building2;
  color: string;
  bg: string;
}> = [
    { key: 'totalCharities', label: 'Charities assigned', icon: Building2, color: 'text-[#266DD3]', bg: 'from-[#EEF4FD] to-[#EAFBFF]' },
    { key: 'notStarted', label: 'Not yet started', icon: CircleDashed, color: 'text-[#F79009]', bg: 'from-[#FFFAEB] to-[#FFF8ED]' },
    { key: 'inProgress', label: 'Started, not completed', icon: CirclePlay, color: 'text-[#7C3AED]', bg: 'from-[#F5F3FF] to-[#FAF5FF]' },
    { key: 'completed', label: 'Completed', icon: CircleCheckBig, color: 'text-[#12B76A]', bg: 'from-[#ECFDF3] to-[#F0FDF4]' },
  ];

export default async function Home() {
  const { unauthenticated } = await baseEndPoint();

  if (unauthenticated) {
    return (
      <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
        Welcome to Zakah Advisor!
        <div>
          <LinkComponent to="/login">
            <Button>Login</Button>
          </LinkComponent>
        </div>
      </div>
    );
  }

  const [meRes, summaryRes] = await Promise.all([
    getMeAction(true),
    getMyAssignmentsSummaryAction(),
  ]);

  const firstName = meRes.ok ? meRes.payload?.data?.firstName : null;
  const summary: AssignmentsSummary = summaryRes.ok && summaryRes.payload?.data?.data
    ? summaryRes.payload.data.data
    : { totalCharities: 0, notStarted: 0, inProgress: 0, completed: 0 };

  return (
    <div className="min-h-screen bg-[#FAFBFC] p-6 sm:p-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[#101928]">
              {firstName ? `Welcome back, ${firstName}` : 'Welcome back'}
            </h1>
            <p className="mt-1 text-sm text-[#667085]">Here&apos;s a summary of the charities assigned to you.</p>
          </div>
          <div className="flex gap-2">
            <LinkComponent to="/charities">
              <Button>View My Charities</Button>
            </LinkComponent>
            <SignOutBtnInHome>Sign Out</SignOutBtnInHome>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {STAT_CARDS.map((card) => {
            const Icon = card.icon
            return (
              <div
                key={card.key}
                className="rounded-2xl border border-[#E8EEF5] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.035)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${card.bg} ${card.color}`}>
                    <Icon className="size-5" />
                  </span>
                  <span className="text-right text-2xl font-semibold text-[#101928]">{summary[card.key]}</span>
                </div>
                <div className="mt-3 text-sm font-semibold text-[#344054]">{card.label}</div>
              </div>
            )
          })}
        </div>

        {summary.totalCharities === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#E4E7EC] bg-white px-4 py-6 text-center text-sm text-[#667085]">
            You don&apos;t have any charities assigned to you yet.
          </div>
        ) : null}
      </div>
    </div>
  );
}
