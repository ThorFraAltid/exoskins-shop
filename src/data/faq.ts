/**
 * FAQ on the Home page. The Figma file has no FAQ section; these answers are a
 * first draft built only from what the site and Simon's brief already state
 * (grip tape skins, the hero labels, the compatibility list, checkout on
 * Amazon). They need Simon's approval before launch.
 */
export interface FaqItem {
  question: string;
  answer: string;
}

export const FAQ: FaqItem[] = [
  {
    question: 'What is an eXo skin?',
    answer:
      'A thin grip tape skin for your gaming mouse. It takes the skins you know from the game and puts them in your hand, so your mouse stops looking like a plain piece of plastic.',
  },
  {
    question: 'Which mice does it fit?',
    answer:
      'Logitech Super Light 1, Logitech Super Light 2, Razer DeathAdder V3 Pro and Razer DeathAdder V4 Pro. Each skin page lists the mice it is compatible with.',
  },
  {
    question: 'Does it change how the mouse feels?',
    answer:
      'It adds grip. Every skin is precision cut for the mouse, nano thin and sweatproof.',
  },
  {
    question: 'How do I buy a skin?',
    answer:
      'Pick a skin in the inventory and press Buy now. That takes you to Amazon, where payment and delivery are handled.',
  },
  {
    question: 'When do new skins drop?',
    answer:
      'More skins are dropping soon. Leave your email under Subscribe to news and you will hear about it first.',
  },
];
