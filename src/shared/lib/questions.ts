/**
 * Questions and Scoring Logic for the Seriousness Test
 * ----------------------------------------------------
 * Contains the 25 bank questions, the function to split them across
 * selected interests, and the score calculation that maps a raw total
 * to a 0-100 score and a level label.
 *
 * Score thresholds (per spec):
 *   Beginner:      0-39%
 *   Learning:     40-64%
 *   Intermediate:  65-84%
 *   Expert:       85-100%
 */

import { scoreToLevel } from '../types';
import type { Level } from '../types';

export interface SeriousnessQuestion {
  q: string;
  options: { text: string; weight: number }[];
}

export const SERIOUSNESS_QUESTIONS: SeriousnessQuestion[] = [
  {
    q: 'How often do you practice your main interest outside of college hours?',
    options: [
      { text: 'Rarely — maybe once a month', weight: 0 },
      { text: 'A few times a month', weight: 1 },
      { text: '2-3 times a week', weight: 2 },
      { text: 'Almost every day', weight: 3 },
    ],
  },
  {
    q: 'When you start a project related to your interest, you usually...',
    options: [
      { text: 'Drop it within a few days', weight: 0 },
      { text: 'Work on it for a couple weeks then lose steam', weight: 1 },
      { text: 'Finish most projects I start', weight: 2 },
      { text: 'See every project through to completion', weight: 3 },
    ],
  },
  {
    q: 'How do you handle feedback on your work?',
    options: [
      { text: 'I avoid sharing my work', weight: 0 },
      { text: 'I listen but rarely act on it', weight: 1 },
      { text: 'I actively seek and apply feedback', weight: 2 },
      { text: 'I build iterations based on structured feedback', weight: 3 },
    ],
  },
  {
    q: 'How much time have you invested in learning your interest formally?',
    options: [
      { text: 'None — I just explore casually', weight: 0 },
      { text: 'A few online videos or tutorials', weight: 1 },
      { text: 'Completed structured courses or bootcamps', weight: 2 },
      { text: 'Multiple courses + mentorship + real projects', weight: 3 },
    ],
  },
  {
    q: 'When faced with a difficult challenge in your interest area, you...',
    options: [
      { text: 'Move on to something easier', weight: 0 },
      { text: 'Try once and give up if it fails', weight: 1 },
      { text: 'Research and try multiple approaches', weight: 2 },
      { text: 'Treat it as a puzzle and persist until solved', weight: 3 },
    ],
  },
  {
    q: 'How do you track your progress in your interest?',
    options: [
      { text: 'I don\'t track progress', weight: 0 },
      { text: 'I have a vague sense of where I am', weight: 1 },
      { text: 'I set occasional goals', weight: 2 },
      { text: 'I maintain a structured progress system', weight: 3 },
    ],
  },
  {
    q: 'How often do you collaborate with others in your interest area?',
    options: [
      { text: 'I work alone always', weight: 0 },
      { text: 'Occasionally when forced to', weight: 1 },
      { text: 'I seek out collaboration opportunities', weight: 2 },
      { text: 'I lead and organize collaborative projects', weight: 3 },
    ],
  },
  {
    q: 'What describes your relationship with deadlines in your interest?',
    options: [
      { text: 'I don\'t set deadlines', weight: 0 },
      { text: 'I set them but usually miss them', weight: 1 },
      { text: 'I meet most deadlines I set', weight: 2 },
      { text: 'I consistently hit or beat my deadlines', weight: 3 },
    ],
  },
  {
    q: 'How deep is your knowledge of the fundamentals in your interest?',
    options: [
      { text: 'Surface level — I know the basics', weight: 0 },
      { text: 'I understand core concepts', weight: 1 },
      { text: 'I can explain fundamentals to others', weight: 2 },
      { text: 'I can teach advanced concepts confidently', weight: 3 },
    ],
  },
  {
    q: 'When was the last time you created something original in your area?',
    options: [
      { text: 'I haven\'t created anything original', weight: 0 },
      { text: 'Months ago', weight: 1 },
      { text: 'Within the last few weeks', weight: 2 },
      { text: 'I create original work regularly', weight: 3 },
    ],
  },
  {
    q: 'How do you handle failure in your interest area?',
    options: [
      { text: 'It discourages me from continuing', weight: 0 },
      { text: 'I take a break and avoid it for a while', weight: 1 },
      { text: 'I analyze what went wrong and retry', weight: 2 },
      { text: 'I treat failure as data and iterate fast', weight: 3 },
    ],
  },
  {
    q: 'How often do you study or practice beyond what\'s required?',
    options: [
      { text: 'Never — I do the minimum', weight: 0 },
      { text: 'Sometimes when motivated', weight: 1 },
      { text: 'Regularly — it\'s part of my routine', weight: 2 },
      { text: 'Constantly — I\'m always going deeper', weight: 3 },
    ],
  },
  {
    q: 'What is your approach to networking in your interest Community?',
    options: [
      { text: 'I don\'t network at all', weight: 0 },
      { text: 'I have a few friends with the same interest', weight: 1 },
      { text: 'I attend events and connect with peers', weight: 2 },
      { text: 'I actively build and maintain a professional network', weight: 3 },
    ],
  },
  {
    q: 'How do you handle competing priorities with your interest?',
    options: [
      { text: 'My interest is the first thing I drop', weight: 0 },
      { text: 'I juggle but my interest often loses', weight: 1 },
      { text: 'I balance my interest with other priorities', weight: 2 },
      { text: 'My interest is a non-negotiable priority', weight: 3 },
    ],
  },
  {
    q: 'How would you rate your consistency over the past 3 months?',
    options: [
      { text: 'Very inconsistent', weight: 0 },
      { text: 'Inconsistent with bursts of effort', weight: 1 },
      { text: 'Fairly consistent', weight: 2 },
      { text: 'Highly consistent — almost no gaps', weight: 3 },
    ],
  },
  {
    q: 'When you learn something new in your area, you...',
    options: [
      { text: 'Forget it quickly', weight: 0 },
      { text: 'Remember the concept but don\'t apply it', weight: 1 },
      { text: 'Apply it to a small project', weight: 2 },
      { text: 'Integrate it into my existing knowledge system', weight: 3 },
    ],
  },
  {
    q: 'How do you measure success in your interest?',
    options: [
      { text: 'I don\'t really measure it', weight: 0 },
      { text: 'By how I feel about it', weight: 1 },
      { text: 'By specific milestones I set', weight: 2 },
      { text: 'By objective metrics and peer benchmarks', weight: 3 },
    ],
  },
  {
    q: 'How often do you help others learn your interest?',
    options: [
      { text: 'Never', weight: 0 },
      { text: 'When directly asked', weight: 1 },
      { text: 'I volunteer to help peers', weight: 2 },
      { text: 'I actively mentor and create learning content', weight: 3 },
    ],
  },
  {
    q: 'What happens when you hit a plateau in your skill level?',
    options: [
      { text: 'I lose interest and move on', weight: 0 },
      { text: 'I stay at the plateau indefinitely', weight: 1 },
      { text: 'I try new approaches to break through', weight: 2 },
      { text: 'I systematically diagnose and push past plateaus', weight: 3 },
    ],
  },
  {
    q: 'How do you stay updated with developments in your interest field?',
    options: [
      { text: 'I don\'t follow updates', weight: 0 },
      { text: 'I occasionally see posts about it', weight: 1 },
      { text: 'I follow key sources regularly', weight: 2 },
      { text: 'I curate multiple sources and stay ahead of trends', weight: 3 },
    ],
  },
  {
    q: 'How would you describe your long-term commitment to this interest?',
    options: [
      { text: 'It\'s a passing hobby', weight: 0 },
      { text: 'I enjoy it but may not stick with it', weight: 1 },
      { text: 'I plan to pursue it through college', weight: 2 },
      { text: 'This is central to my career and life path', weight: 3 },
    ],
  },
  {
    q: 'When you see someone better than you at your interest, you feel...',
    options: [
      { text: 'Intimidated and discouraged', weight: 0 },
      { text: 'A bit jealous', weight: 1 },
      { text: 'Inspired to improve', weight: 2 },
      { text: 'Driven to learn from them directly', weight: 3 },
    ],
  },
  {
    q: 'How often do you set specific, measurable goals for your interest?',
    options: [
      { text: 'I never set goals', weight: 0 },
      { text: 'I have vague aspirations', weight: 1 },
      { text: 'I set goals every few months', weight: 2 },
      { text: 'I set and review goals weekly or monthly', weight: 3 },
    ],
  },
  {
    q: 'What best describes your portfolio or body of work?',
    options: [
      { text: 'I don\'t have one', weight: 0 },
      { text: 'A few incomplete pieces', weight: 1 },
      { text: 'Several completed projects', weight: 2 },
      { text: 'A polished, growing portfolio I\'m proud of', weight: 3 },
    ],
  },
  {
    q: 'If you had 3 free months with no college, how would you spend it?',
    options: [
      { text: 'Relax and do nothing related to my interest', weight: 0 },
      { text: 'Maybe dabble a bit in my interest', weight: 1 },
      { text: 'Dedicate significant time to my interest', weight: 2 },
      { text: 'Go all-in — treat it like a full-time pursuit', weight: 3 },
    ],
  },
];

const TOTAL_QUESTIONS = 25;

/**
 * Split the 25-question bank across the user's selected interests.
 * If the user picked 1 interest, they get all 25.
 * If they picked 2, each gets ~12-13 questions.
 */
export function getQuestionsForInterests(interestCount: number): SeriousnessQuestion[][] {
  if (interestCount <= 1) {
    return [SERIOUSNESS_QUESTIONS.slice(0, TOTAL_QUESTIONS)];
  }
  const perInterest = Math.ceil(TOTAL_QUESTIONS / interestCount);
  const result: SeriousnessQuestion[][] = [];
  for (let i = 0; i < interestCount; i++) {
    const start = i * perInterest;
    const end = Math.min(start + perInterest, TOTAL_QUESTIONS);
    result.push(SERIOUSNESS_QUESTIONS.slice(start, end));
  }
  const assigned = result.reduce((sum, q) => sum + q.length, 0);
  if (assigned < TOTAL_QUESTIONS && result.length > 0) {
    const needed = TOTAL_QUESTIONS - assigned;
    const pool = SERIOUSNESS_QUESTIONS.slice(result[result.length - 1].length);
    result[result.length - 1].push(...pool.slice(0, needed));
  }
  return result;
}

/**
 * Calculate the score and level from the user's answers.
 * @param answers  - Array of selected option indices (0-3 each)
 * @param questionCount - Number of questions answered
 * @returns score (0-100) and level label
 */
export function calculateScore(answers: number[], questionCount: number): { score: number; level: Level } {
  const maxPossible = questionCount * 3;
  const raw = answers.reduce((sum, a) => sum + a, 0);
  const score = Math.round((raw / maxPossible) * 100);
  return { score, level: scoreToLevel(score) };
}
