export type FontOption = {
  key: "kaiti" | "xingkai" | "songti" | "heiti" | "fangti";
  label: string;
  family: string;
  check: string;
  tag?: string;
};

import type { FontKey } from "./types";

export const fontOptions: FontOption[] = [
  {
    key: "kaiti",
    label: "楷体",
    family: "'FontSwitcherKai', 'KaiTi', serif",
    check: '16px "FontSwitcherKai"',
  },
  {
    key: "xingkai",
    label: "行楷",
    family: "'FontSwitcherXing', 'FontSwitcherKai', serif",
    check: '16px "FontSwitcherXing"',
    tag: "System font dependent",
  },
  {
    key: "songti",
    label: "宋体",
    family: "'FontSwitcherSong', 'SimSun', serif",
    check: '16px "FontSwitcherSong"',
  },
  {
    key: "heiti",
    label: "黑体",
    family: "'FontSwitcherHei', 'Microsoft YaHei', sans-serif",
    check: '16px "FontSwitcherHei"',
  },
  {
    key: "fangti",
    label: "仿宋",
    family: "'FontSwitcherFang', 'FangSong', serif",
    check: '16px "FontSwitcherFang"',
  },
];

export const fontFaceCss = `
  @font-face {
    font-family: "FontSwitcherKai";
    src: local("Kaiti SC Regular"), local("Kaiti SC"), local("STKaiti"),
      local("KaiTi"), local("KaiTi_GB2312"), local("SimKai");
  }

  @font-face {
    font-family: "FontSwitcherXing";
    src: local("STXingkai"), local("华文行楷"), local("Xingkai SC");
  }

  @font-face {
    font-family: "FontSwitcherSong";
    src: local("SimSun"), local("Songti SC"), local("STSong"), local("NSimSun");
  }

  @font-face {
    font-family: "FontSwitcherHei";
    src: local("Microsoft YaHei"), local("PingFang SC"), local("Heiti SC"),
      local("SimHei"), local("Noto Sans CJK SC");
  }

  @font-face {
    font-family: "FontSwitcherFang";
    src: local("FangSong"), local("STFangsong"), local("FangSong_GB2312");
  }

  body.font-switcher-kai,
  body.font-switcher-kai * {
    font-family: "FontSwitcherKai", "KaiTi", serif !important;
  }

  body.font-switcher-xing,
  body.font-switcher-xing * {
    font-family: "FontSwitcherXing", "FontSwitcherKai", "KaiTi", serif !important;
  }

  body.font-switcher-song,
  body.font-switcher-song * {
    font-family: "FontSwitcherSong", "SimSun", serif !important;
  }

  body.font-switcher-hei,
  body.font-switcher-hei * {
    font-family: "FontSwitcherHei", "Microsoft YaHei", sans-serif !important;
  }

  body.font-switcher-fang,
  body.font-switcher-fang * {
    font-family: "FontSwitcherFang", "FangSong", serif !important;
  }
`;

export const fontClassMap: Record<Exclude<FontKey, "">, string> = {
  kaiti: "font-switcher-kai",
  xingkai: "font-switcher-xing",
  songti: "font-switcher-song",
  heiti: "font-switcher-hei",
  fangti: "font-switcher-fang",
};
