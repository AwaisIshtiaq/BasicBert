export type Example = {
  label: string;
  lang: "EN" | "UR";
  text: string;
};

export const MLM_EXAMPLES: Example[] = [
  {
    label: "Model card",
    lang: "EN",
    text: "BasicBERT is a <MASK> model for English and Urdu",
  },
  {
    label: "Attention",
    lang: "EN",
    text: "The transformer uses multi-head <MASK> to weigh context",
  },
  {
    label: "PyTorch",
    lang: "EN",
    text: "The weights are trained from scratch using <MASK>",
  },
  {
    label: "اردو جملہ",
    lang: "UR",
    text: "BasicBERT اردو اور انگریزی کے لیے ایک <MASK> ماڈل ہے",
  },
  {
    label: "زبان",
    lang: "UR",
    text: "یہ ماڈل <MASK> اور انگریزی دونوں زبانیں سمجھتا ہے",
  },
];

export const CLASSIFICATION_EXAMPLES: Example[] = [
  {
    label: "Positive",
    lang: "EN",
    text: "BasicBERT is fast, clean, and the Urdu support is surprisingly good!",
  },
  {
    label: "Negative",
    lang: "EN",
    text: "The training kept crashing and the results were pretty disappointing.",
  },
  {
    label: "Neutral-ish",
    lang: "EN",
    text: "It runs on my machine, though I have not tested it at scale yet.",
  },
  {
    label: "مثبت",
    lang: "UR",
    text: "یہ ماڈل بہت تیز ہے اور اردو کی سپورٹ واقعی شاندار ہے!",
  },
  {
    label: "منفی",
    lang: "UR",
    text: "تربیت بار بار رک جاتی ہے اور نتائج کافی مایوس کن ہیں۔",
  },
];
