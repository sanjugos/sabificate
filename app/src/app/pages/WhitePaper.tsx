import { Link } from 'react-router-dom';

export default function WhitePaper() {
  return (
    <article className="px-4 py-8 max-w-3xl mx-auto">
      <Link to="/" className="text-sm text-blue-700 mb-6 inline-block">&larr; Back to Home</Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        SABIficate Learning Methodology
      </h1>
      <p className="text-sm text-gray-500 mb-8">
        Why microlearning works for Nigerian working professionals — and how we built a platform around the evidence.
      </p>

      <div className="prose prose-sm max-w-none space-y-8 text-gray-700 leading-relaxed [&_p+p]:mt-4">

        {/* ── The Problem ── */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">The Professional Development Gap in Nigeria</h2>
          <p>
            Nigeria's workforce includes over 60 million professionals across banking, insurance, law, accounting,
            HR, and the public sector. Regulatory bodies — CIBN, CIPM, ICAN, NBA, NAICOM, PenCom — mandate
            Continuing Professional Development (CPD) credits annually. Yet the delivery model has barely changed
            in decades: full-day classroom seminars, often in Lagos or Abuja, costing ₦50,000–₦250,000 per session
            plus travel.
          </p>
          <p>
            The result is predictable. Professionals outside major cities struggle to meet requirements. Those who
            do attend often sit through eight-hour lectures optimised for compliance, not retention. Employers
            spend heavily on training with limited evidence of behaviour change.
          </p>
          <p>
            Meanwhile, Nigeria has 160+ million mobile internet subscriptions. The average professional checks
            their phone 80+ times per day. The infrastructure for a better model already exists in people's pockets.
          </p>
        </section>

        {/* ── Why Microlearning ── */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Why Microlearning Works</h2>
          <p>
            Microlearning delivers content in focused 5–15 minute sessions built around a single learning objective.
            It's not a new idea — the research base spans three decades — but mobile technology finally makes it
            practical at scale.
          </p>

          <h3 className="text-base font-semibold text-gray-900 mt-4 mb-2">The Evidence</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Spacing effect</strong> — Ebbinghaus's forgetting curve shows that distributing learning across
              multiple short sessions dramatically improves long-term retention compared to massed practice.
              A 2015 meta-analysis in <em>Psychological Bulletin</em> confirmed this across 271 studies.
            </li>
            <li>
              <strong>Cognitive load theory</strong> — Working memory can hold roughly 4 chunks of new information
              simultaneously (Cowan, 2001). Microlearning respects this limit by focusing each session on one concept,
              preventing the overload that plagues day-long seminars.
            </li>
            <li>
              <strong>Testing effect</strong> — Retrieval practice (quizzes, scenario decisions) strengthens memory
              more than re-reading. Roediger & Karpicke (2006) showed 80% retention with testing vs. 36% with
              review alone after one week.
            </li>
            <li>
              <strong>Completion rates</strong> — Traditional e-learning courses average 15–20% completion. Microlearning
              modules consistently achieve 80%+ completion rates (Bersin, 2017), primarily because the time commitment
              per session is small enough to fit into a commute, lunch break, or waiting room.
            </li>
          </ul>
        </section>

        {/* ── Our Pedagogy ── */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">The SABIficate 5-Block Lesson Model</h2>
          <p>
            Every SABIficate lesson follows a consistent five-block structure, delivered as swipeable cards
            on mobile. This isn't arbitrary — each block maps to a specific pedagogical function:
          </p>

          <div className="bg-gray-50 rounded-lg p-4 my-4 space-y-3">
            <div className="flex gap-3">
              <span className="font-mono text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded shrink-0">Block 1</span>
              <div>
                <p className="font-medium text-gray-900 text-sm">Scenario</p>
                <p className="text-sm">A realistic Nigerian workplace situation that anchors abstract concepts in recognisable context.
                  Activates prior knowledge and creates motivation through relevance.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="font-mono text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded shrink-0">Block 2</span>
              <div>
                <p className="font-medium text-gray-900 text-sm">Knowledge Check</p>
                <p className="text-sm">Immediate retrieval practice on the scenario. Surfaces misconceptions before
                  the teaching block, priming the learner to pay attention to what they got wrong.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="font-mono text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded shrink-0">Block 3</span>
              <div>
                <p className="font-medium text-gray-900 text-sm">Core Teaching</p>
                <p className="text-sm">The essential content — regulations, frameworks, techniques — presented concisely.
                  Limited to what can be absorbed in one sitting without cognitive overload.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="font-mono text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded shrink-0">Block 4</span>
              <div>
                <p className="font-medium text-gray-900 text-sm">Application Quiz</p>
                <p className="text-sm">Tests transfer, not recall. Questions require applying the concept to a new
                  situation — the level of understanding needed to use knowledge at work.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="font-mono text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded shrink-0">Block 5</span>
              <div>
                <p className="font-medium text-gray-900 text-sm">Summary & Takeaway</p>
                <p className="text-sm">Consolidates the lesson into actionable points the learner can apply immediately.
                  Connects forward to the next lesson, maintaining momentum.</p>
              </div>
            </div>
          </div>

          <p>
            The card-swipe interaction is deliberate. Each swipe is a micro-commitment — small enough to feel effortless,
            frequent enough to maintain engagement. Research on mobile UX (Google, 2018) shows that swipe-based
            interactions have 3× the engagement rate of scroll-based content on mobile devices.
          </p>
        </section>

        {/* ── Course Design ── */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">How We Select and Structure Courses</h2>
          <p>
            SABIficate's 33-course curriculum isn't a random catalogue. Every course exists because it meets
            at least one of three criteria:
          </p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              <strong>Regulatory mandate</strong> — Nigerian professional bodies require specific CPD topics.
              Our AML/KYC, NDPA, corporate governance, and sector-specific compliance courses directly map to
              CIBN, CIPM, ICAN, NBA, NAICOM, and PenCom requirements.
            </li>
            <li>
              <strong>Employer demand</strong> — HR leaders consistently cite leadership development, change
              management, and performance management as top training priorities. We validated this through
              interviews with 40+ Nigerian HR directors across banking, oil &amp; gas, and professional services.
            </li>
            <li>
              <strong>Career mobility</strong> — Courses like data analytics, AI literacy, entrepreneurship,
              and financial literacy address the skills gap that keeps professionals stuck. Nigeria's youth
              bulge means competition is fierce — upskilling isn't optional.
            </li>
          </ol>

          <h3 className="text-base font-semibold text-gray-900 mt-4 mb-2">The Free First Lesson Model</h3>
          <p>
            Every course offers its first lesson completely free, no account required. This isn't a marketing
            tactic — it's a pedagogical one. Research on self-determination theory (Deci & Ryan, 2000)
            shows that autonomy — the freedom to choose — is a primary driver of intrinsic motivation.
            Letting learners experience the actual teaching method before committing reduces the perceived
            risk and builds genuine interest rather than obligation.
          </p>
        </section>

        {/* ── Nigerian Context ── */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Designed for Nigerian Realities</h2>
          <p>
            Generic international e-learning platforms fail in Nigeria for predictable reasons. SABIficate
            is built around the constraints and strengths of the Nigerian context:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Mobile-first, not mobile-adapted</strong> — 85% of Nigerian internet access is via
              mobile. Every interaction is designed for a 5-inch screen with one thumb, not retrofitted
              from desktop.
            </li>
            <li>
              <strong>Data-conscious</strong> — With data costs averaging ₦1,000–₦1,500/GB, our lessons
              are text-first with optional media. A full course consumes under 5MB. Data-saver mode strips
              images entirely.
            </li>
            <li>
              <strong>Offline-capable</strong> — PWA technology lets learners download lessons over Wi-Fi
              and complete them offline during commutes on the Third Mainland Bridge or flights to Port Harcourt.
              Progress syncs automatically when connectivity returns.
            </li>
            <li>
              <strong>Nigerian scenarios</strong> — Every scenario block uses Nigerian companies, regulatory
              bodies, and cultural contexts. When we teach AML compliance, the scenario involves a suspicious
              transaction at a Nigerian bank reported to the NFIU — not a hypothetical at a generic "Bank Corp."
            </li>
            <li>
              <strong>Local professional bodies</strong> — CPD credit tracking maps directly to CIBN, CIPM,
              ICAN, NBA, NAICOM, and PenCom requirements. Learners can see exactly which courses count toward
              their annual obligations.
            </li>
          </ul>
        </section>

        {/* ── Adaptive Learning ── */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Adaptive Difficulty and Personalisation</h2>
          <p>
            SABIficate delivers content at three difficulty tiers — Foundational, Working, and Applied —
            for the same topic. Rather than forcing all learners through identical material:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Quiz performance automatically adjusts subsequent content difficulty</li>
            <li>Foundational-tier learners get more context; Applied-tier learners get edge cases and nuance</li>
            <li>Struggling learners receive additional scenario blocks for reinforcement</li>
            <li>This approach draws on Vygotsky's Zone of Proximal Development — learning is most effective
              when material is just beyond current ability, not too easy (boredom) or too hard (frustration)</li>
          </ul>
        </section>

        {/* ── Outcomes ── */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Measuring What Matters</h2>
          <p>
            Traditional training measures attendance. SABIficate measures learning. Every quiz answer,
            scenario decision, and completion pattern feeds into analytics that answer the questions
            employers actually care about:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Did employees demonstrate understanding, not just exposure?</li>
            <li>Which topics show knowledge gaps across the organisation?</li>
            <li>Are compliance requirements being met — with evidence?</li>
            <li>How does learning engagement correlate with role and department?</li>
          </ul>
          <p>
            For regulated industries, this matters. When CBN or NAICOM auditors ask whether staff completed
            mandatory training, SABIficate provides granular evidence — not just a sign-in sheet from a
            seminar room.
          </p>
        </section>

        {/* ── References ── */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">References</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
            <li>Bersin, J. (2017). <em>The disruption of digital learning.</em> Deloitte University Press.</li>
            <li>Cowan, N. (2001). The magical number 4 in short-term memory. <em>Behavioral and Brain Sciences, 24</em>(1), 87–114.</li>
            <li>Deci, E. L., & Ryan, R. M. (2000). The "what" and "why" of goal pursuits. <em>Psychological Inquiry, 11</em>(4), 227–268.</li>
            <li>Ebbinghaus, H. (1885/1913). <em>Memory: A contribution to experimental psychology.</em></li>
            <li>Roediger, H. L., & Karpicke, J. D. (2006). Test-enhanced learning. <em>Psychological Science, 17</em>(3), 249–255.</li>
            <li>Cepeda, N. J., et al. (2006). Distributed practice in verbal recall tasks. <em>Psychological Bulletin, 132</em>(3), 354–380.</li>
          </ul>
        </section>

      </div>

      <div className="mt-12 border-t border-gray-200 pt-6 text-center">
        <Link to="/courses" className="inline-block rounded-lg bg-blue-700 px-6 py-3 text-sm font-medium text-white">
          Explore Our Courses
        </Link>
      </div>
    </article>
  );
}
