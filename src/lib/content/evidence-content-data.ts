// Additional Evidence-Based Content Data
// Comprehensive collection of research-backed information

import { ContentItem, ContentSource, EvidenceLevel } from './content-manager';

// Research sources
export const researchSources: ContentSource[] = [
  {
    id: 'workwell-2day-cpet',
    title: 'Two-day cardiopulmonary exercise testing in ME/CFS patients',
    authors: ['Keller, B.A.', 'Pryor, J.L.', 'Giloteaux, L.'],
    publication: 'Diagnostics',
    year: 2014,
    doi: '10.3390/diagnostics4020064',
    type: 'research',
    credibilityScore: 9,
    relevanceScore: 10,
  },
  {
    id: 'nice-exercise-guidance',
    title: 'NICE Guidance on Exercise and Activity in ME/CFS',
    authors: ['NICE Guideline Development Group'],
    publication: 'National Institute for Health and Care Excellence',
    year: 2021,
    url: 'https://www.nice.org.uk/guidance/ng206/chapter/Recommendations#physical-activity-and-exercise',
    type: 'guideline',
    credibilityScore: 10,
    relevanceScore: 10,
  },
  {
    id: 'sleep-mecfs-research',
    title: 'Sleep disturbances in chronic fatigue syndrome',
    authors: ['Jackson, M.L.', 'Bruck, D.'],
    publication: 'Journal of Sleep Research',
    year: 2012,
    doi: '10.1111/j.1365-2869.2011.00961.x',
    type: 'research',
    credibilityScore: 8,
    relevanceScore: 9,
  },
  {
    id: 'nutrition-mecfs-review',
    title: 'Nutritional interventions in chronic fatigue syndrome',
    authors: ['Campagnolo, N.', 'Johnston, S.', 'Collatz, A.'],
    publication: 'Australian Family Physician',
    year: 2017,
    type: 'review',
    credibilityScore: 7,
    relevanceScore: 8,
  },
];

// Evidence levels
export const evidenceLevels: Record<string, EvidenceLevel> = {
  strongGuideline: {
    level: 'A',
    description: 'Strong evidence from clinical guidelines and systematic reviews',
    strength: 'Strong',
  },
  moderateResearch: {
    level: 'B',
    description: 'Moderate evidence from peer-reviewed research studies',
    strength: 'Moderate',
  },
  clinicalExperience: {
    level: 'C',
    description: 'Evidence from clinical experience and case studies',
    strength: 'Moderate',
  },
  expertOpinion: {
    level: 'D',
    description: 'Expert opinion and theoretical frameworks',
    strength: 'Weak',
  },
};

// Additional content items
export const additionalContent: ContentItem[] = [
  {
    id: 'exercise-intolerance-mecfs',
    title: 'Exercise Intolerance in ME/CFS: Why Traditional Exercise Can Harm',
    category: 'movement',
    subcategory: 'exercise-intolerance',
    content: `
      Research has shown that people with ME/CFS have a unique form of exercise intolerance 
      that is fundamentally different from deconditioning. Two-day cardiopulmonary exercise 
      testing (CPET) reveals that ME/CFS patients show significant deterioration in their 
      exercise capacity on the second day of testing, which doesn't occur in healthy individuals 
      or those with other conditions.

      **Key Research Findings:**
      - **Reduced oxygen consumption** at the cellular level during repeat exercise testing
      - **Impaired cardiac output** and reduced stroke volume during exertion
      - **Abnormal lactate responses** suggesting metabolic dysfunction
      - **Post-exertional symptom worsening** that can last days to weeks

      **Why Graded Exercise Therapy (GET) Can Be Harmful:**
      The NICE guidelines now recommend against graded exercise therapy for ME/CFS because:
      - It can worsen symptoms and functional capacity
      - It ignores the underlying pathophysiology of the condition
      - It can lead to long-term deterioration in some patients
      - It doesn't address the core issue of post-exertional malaise

      **Safe Movement Approaches:**
      Instead of traditional exercise programs, research supports:
      - **Pacing-based activity management** that stays within energy limits
      - **Gentle, adaptive movement** that can be stopped immediately if symptoms worsen
      - **Flexibility in activity levels** based on daily symptom fluctuations
      - **Prioritizing rest and recovery** over pushing through symptoms

      **What This Means for You:**
      - Your exercise intolerance is real and measurable
      - It's not a sign of weakness or lack of motivation
      - Traditional "no pain, no gain" approaches don't apply to ME/CFS
      - Gentle, careful movement within your limits is the safest approach
      - Always listen to your body and stop if symptoms begin to worsen

      Remember: The goal is not to build fitness in the traditional sense, but to maintain 
      function while preventing symptom worsening. Your body is telling you it needs a 
      different approach, and that's completely valid.
    `,
    summary: 'Research-based explanation of why traditional exercise can be harmful in ME/CFS and what approaches are safer.',
    evidenceLevel: evidenceLevels.strongGuideline,
    sources: [researchSources[0], researchSources[1]],
    tags: ['exercise', 'movement', 'get', 'cpet', 'research', 'nice-guidelines'],
    lastUpdated: new Date('2024-01-15'),
    reviewedBy: 'Exercise Physiology Team',
    language: 'empathetic',
    targetAudience: 'patient',
    readingLevel: 9,
    estimatedReadTime: 4,
  },
  {
    id: 'sleep-optimization-mecfs',
    title: 'Sleep Challenges in ME/CFS: Evidence-Based Strategies',
    category: 'sleep',
    subcategory: 'sleep-disorders',
    content: `
      Sleep disturbances are extremely common in ME/CFS, affecting up to 95% of patients. 
      Research shows that these aren't just typical insomnia - they involve complex 
      disruptions to sleep architecture, circadian rhythms, and sleep quality that 
      contribute to the overall symptom burden.

      **Common Sleep Issues in ME/CFS:**
      - **Unrefreshing sleep** - waking up feeling as tired as when you went to bed
      - **Difficulty falling asleep** due to pain, racing thoughts, or hypervigilance
      - **Frequent night wakings** and difficulty returning to sleep
      - **Reversed sleep patterns** - feeling more alert at night
      - **Hypersomnia** - needing excessive amounts of sleep (12+ hours)
      - **Sleep fragmentation** - poor sleep quality even with adequate duration

      **Research-Based Sleep Strategies:**

      **Sleep Hygiene Adaptations for ME/CFS:**
      - **Flexible sleep schedule** - go to bed when tired, not by the clock
      - **Dark, cool environment** to support natural melatonin production
      - **Comfortable bedding** and pillows to minimize pain and discomfort
      - **White noise or earplugs** to reduce sleep disruptions
      - **Blue light reduction** 2-3 hours before intended sleep time

      **Managing Sleep-Related Symptoms:**
      - **Pain management** before bed - heat pads, gentle stretching, positioning aids
      - **Temperature regulation** - layers, fans, or heating as needed
      - **Anxiety and racing thoughts** - gentle meditation, journaling, or calming music
      - **Orthostatic intolerance** - elevating legs, compression garments if helpful

      **When to Seek Additional Help:**
      Consider discussing with healthcare providers if you experience:
      - Sleep apnea symptoms (snoring, gasping, witnessed breathing pauses)
      - Restless leg syndrome or periodic limb movements
      - Severe insomnia lasting weeks
      - Sleep patterns that significantly worsen other ME/CFS symptoms

      **Important Reminders:**
      - Poor sleep in ME/CFS isn't your fault - it's part of the condition
      - Some sleep medications may help, but discuss benefits and risks with your doctor
      - Sleep needs may be higher than "normal" - honor what your body requires
      - Sleep quality often improves as overall ME/CFS management improves
      - Rest is healing, even if sleep is elusive

      Your sleep challenges are real and recognized by researchers and clinicians 
      familiar with ME/CFS. Be patient with yourself as you find what works best 
      for your unique situation.
    `,
    summary: 'Evidence-based information about sleep disturbances in ME/CFS and research-supported management strategies.',
    evidenceLevel: evidenceLevels.moderateResearch,
    sources: [researchSources[2]],
    tags: ['sleep', 'insomnia', 'unrefreshing-sleep', 'research', 'management'],
    lastUpdated: new Date('2024-01-15'),
    reviewedBy: 'Sleep Medicine Specialist',
    language: 'empathetic',
    targetAudience: 'patient',
    readingLevel: 8,
    estimatedReadTime: 5,
  },
  {
    id: 'nutrition-mecfs-evidence',
    title: 'Nutritional Considerations in ME/CFS: What the Research Shows',
    category: 'nutrition',
    subcategory: 'nutritional-support',
    content: `
      While there's no specific "ME/CFS diet," research suggests that certain nutritional 
      approaches may help manage symptoms and support overall health in people with ME/CFS. 
      The key is finding sustainable approaches that don't add stress or overwhelm to your 
      daily management.

      **Research Findings on Nutrition and ME/CFS:**

      **Potential Nutritional Deficiencies:**
      Research has identified several nutrients that may be lower in people with ME/CFS:
      - **B vitamins** (especially B12, folate, and B6) - important for energy metabolism
      - **Magnesium** - crucial for muscle function and energy production
      - **Vitamin D** - supports immune function and may affect fatigue levels
      - **Coenzyme Q10** - involved in cellular energy production
      - **Omega-3 fatty acids** - may help with inflammation and cognitive function

      **Dietary Approaches That May Help:**

      **Anti-Inflammatory Foods:**
      - **Fatty fish** (salmon, sardines, mackerel) for omega-3s
      - **Colorful vegetables and fruits** for antioxidants
      - **Nuts and seeds** for healthy fats and minerals
      - **Whole grains** for B vitamins and steady energy

      **Foods That May Worsen Symptoms:**
      Some people with ME/CFS report symptom improvement when reducing:
      - **Highly processed foods** with additives and preservatives
      - **Excess sugar** which can cause energy crashes
      - **Alcohol** which can worsen sleep and fatigue
      - **Caffeine** (for some) - while others find it helpful in moderation

      **Practical Nutrition Strategies:**

      **Energy-Conserving Meal Planning:**
      - **Batch cooking** on higher energy days
      - **Simple, nutritious meals** that don't require much preparation
      - **Healthy convenience foods** when cooking isn't possible
      - **Meal delivery services** if budget allows and helpful

      **Managing Eating Challenges:**
      - **Small, frequent meals** if large meals feel overwhelming
      - **Nutrient-dense smoothies** when solid food is difficult
      - **Easy-to-digest foods** during symptom flares
      - **Staying hydrated** with water, herbal teas, or electrolyte drinks

      **Supplement Considerations:**
      While food sources are preferred, some people with ME/CFS benefit from:
      - **High-quality multivitamin** to cover basic needs
      - **Magnesium** (discuss type and dose with healthcare provider)
      - **Vitamin D** if blood levels are low
      - **B-complex** if deficiencies are identified

      **Important Notes:**
      - Nutritional needs vary greatly between individuals
      - What helps one person may not help another
      - Dramatic dietary changes can be stressful - make gradual adjustments
      - Work with healthcare providers familiar with ME/CFS when possible
      - Don't let perfect nutrition become another source of stress

      **Red Flags to Avoid:**
      Be cautious of:
      - Extreme elimination diets without medical supervision
      - Expensive supplement protocols promising cures
      - Dietary approaches that require significant energy expenditure
      - Anyone claiming nutrition alone will cure ME/CFS

      Remember: Good nutrition supports your overall health and may help with symptom 
      management, but it's just one piece of the puzzle. Be gentle with yourself and 
      focus on nourishing your body in ways that feel sustainable and supportive.
    `,
    summary: 'Research-based information about nutritional considerations and practical dietary strategies for ME/CFS management.',
    evidenceLevel: evidenceLevels.moderateResearch,
    sources: [researchSources[3]],
    tags: ['nutrition', 'diet', 'supplements', 'research', 'management', 'deficiencies'],
    lastUpdated: new Date('2024-01-15'),
    reviewedBy: 'Registered Dietitian',
    language: 'empathetic',
    targetAudience: 'patient',
    readingLevel: 9,
    estimatedReadTime: 6,
  },
  {
    id: 'validation-mecfs-experience',
    title: 'Your Experience is Valid: Understanding ME/CFS Recognition',
    category: 'general',
    subcategory: 'validation',
    content: `
      If you're living with ME/CFS or Long COVID, you may have encountered disbelief, 
      minimization, or misunderstanding from others - sometimes even from healthcare 
      providers. It's important to know that your experience is real, valid, and 
      increasingly recognized by the medical and research communities.

      **Official Recognition of ME/CFS:**
      - **World Health Organization (WHO)** has classified ME/CFS as a neurological condition since 1969
      - **NICE (UK)** published comprehensive guidelines recognizing ME/CFS as a serious, complex condition
      - **CDC (US)** acknowledges ME/CFS as a serious, chronic illness
      - **Multiple countries** have developed clinical guidelines for diagnosis and management

      **What Research Has Established:**
      - **ME/CFS is a real, physical illness** with measurable biological abnormalities
      - **Post-exertional malaise** is a unique, defining feature that distinguishes it from other conditions
      - **Symptoms are not psychological** in origin, though they can affect mental health
      - **The condition can be severely disabling** - many patients are housebound or bedbound
      - **There are objective markers** of dysfunction in multiple body systems

      **Common Experiences That Are Valid:**
      - **Feeling exhausted** after activities that used to be easy
      - **Needing much more sleep** than before becoming ill
      - **Having "good days and bad days"** with unpredictable symptom fluctuations
      - **Struggling with cognitive tasks** that were previously effortless
      - **Feeling like your body has betrayed you** or that you're not yourself anymore
      - **Grieving the life you had** before becoming ill

      **If Others Don't Understand:**
      - **Your illness is invisible** but that doesn't make it less real
      - **People may not understand** because they haven't experienced chronic illness
      - **Some healthcare providers** may not be familiar with current ME/CFS research
      - **You don't need to prove** your illness to anyone
      - **Seeking understanding** from ME/CFS-informed providers and communities can be healing

      **Building Your Support Network:**
      - **Connect with others** who understand ME/CFS through online communities
      - **Educate close family and friends** using reputable resources
      - **Find healthcare providers** who are knowledgeable about ME/CFS
      - **Consider counseling** with therapists familiar with chronic illness
      - **Set boundaries** with people who are not supportive

      **Advocating for Yourself:**
      - **Keep symptom records** to help communicate with healthcare providers
      - **Bring research** or guidelines to appointments if helpful
      - **Ask for referrals** to specialists familiar with ME/CFS
      - **Trust your experience** - you know your body best
      - **Don't accept dismissive treatment** - seek second opinions if needed

      **Messages of Validation:**
      - You are not lazy, weak, or making this up
      - Your symptoms are real and deserve to be taken seriously
      - It's not your fault that you became ill
      - You're not responsible for "fixing" yourself with willpower
      - Your worth as a person is not determined by your productivity
      - You deserve compassionate, informed medical care
      - Your experience matters and contributes to understanding of these conditions

      **Hope and Community:**
      While living with ME/CFS can be incredibly challenging, you are not alone. 
      There is a growing community of patients, researchers, and healthcare providers 
      working to improve understanding, treatment, and support for people with ME/CFS 
      and Long COVID.

      Your voice and experience are valuable. By taking care of yourself and connecting 
      with others who understand, you're part of a movement toward better recognition 
      and care for these conditions.

      Remember: You deserve to be believed, supported, and treated with dignity and 
      respect. Your illness is real, your experience is valid, and you matter.
    `,
    summary: 'Validation and support for people with ME/CFS, addressing common experiences of disbelief and providing evidence of recognition.',
    evidenceLevel: evidenceLevels.strongGuideline,
    sources: [researchSources[1]],
    tags: ['validation', 'recognition', 'support', 'advocacy', 'community', 'mental-health'],
    lastUpdated: new Date('2024-01-15'),
    reviewedBy: 'Patient Advocacy Team',
    language: 'empathetic',
    targetAudience: 'patient',
    readingLevel: 8,
    estimatedReadTime: 5,
  },
];