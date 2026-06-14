import type { ContentBlock } from '../../../contracts/schemas/content';
import type { DataSaverMode } from '../../../contracts/types';
import type { QuizAnswer } from '../../../contracts/api/progress';
import { TextBlock } from './TextBlock';
import { QuizBlock } from './QuizBlock';
import { ArtifactPromptBlock } from './ArtifactPromptBlock';
import { ScenarioBlock } from './ScenarioBlock';

interface ContentBlockRendererProps {
  block: ContentBlock;
  dataSaverMode: DataSaverMode;
  onQuizAnswer?: (answer: QuizAnswer) => void;
  onArtifactSubmit?: (blockId: string, text: string) => void;
  previousQuizAnswer?: QuizAnswer;
}

export function ContentBlockRenderer({
  block,
  dataSaverMode,
  onQuizAnswer,
  onArtifactSubmit,
  previousQuizAnswer,
}: ContentBlockRendererProps) {
  switch (block.type) {
    case 'text_block':
      return <TextBlock content={block.content} dataSaverMode={dataSaverMode} />;

    case 'quiz_block':
      return (
        <QuizBlock
          id={block.id}
          question={block.question}
          options={block.options}
          correct_answer={block.correct_answer}
          explanation={block.explanation}
          bloom_level={block.bloom_level}
          onAnswer={(answer) => onQuizAnswer?.(answer)}
          previousAnswer={previousQuizAnswer}
        />
      );

    case 'artifact_prompt_block':
      return (
        <ArtifactPromptBlock
          id={block.id}
          prompt={block.prompt}
          target_role={block.target_role}
          industry_vertical={block.industry_vertical}
          career_level={block.career_level}
          rubric={block.rubric}
          onSubmit={(text) => onArtifactSubmit?.(block.id, text)}
        />
      );

    case 'scenario_block':
      return (
        <ScenarioBlock
          scenario={block.scenario}
          company_type={block.company_type}
          regulatory_body={block.regulatory_body}
          cultural_notes={block.cultural_notes}
          decision_tree={block.decision_tree}
        />
      );

    default:
      return null;
  }
}
