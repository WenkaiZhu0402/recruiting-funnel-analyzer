const { useEffect, useMemo, useState } = React;
const {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} = Recharts;

const STAGES = [
  { key: "applied_date", label: "投递" },
  { key: "screen_date", label: "初筛" },
  { key: "interview1_date", label: "一面" },
  { key: "interview2_date", label: "二面" },
  { key: "offer_date", label: "Offer" },
  { key: "hire_date", label: "入职" },
];

const REQUIRED_COLUMNS = [
  "candidate_id",
  "name",
  "role",
  "department",
  "city",
  "source",
  "recruiter",
  "current_stage",
  "applied_date",
  "screen_date",
  "interview1_date",
  "interview2_date",
  "offer_date",
  "hire_date",
  "reject_reason",
];

const DATE_COLUMNS = ["applied_date", "screen_date", "interview1_date", "interview2_date", "offer_date", "hire_date"];

const SAMPLE_SOURCES = ["BOSS直聘", "实习僧", "猎聘", "智联招聘", "前程无忧", "LinkedIn", "内推", "校招官网", "微信社群"];
const SAMPLE_CITIES = ["北京", "上海", "深圳", "杭州", "广州", "成都"];
const SAMPLE_RECRUITERS = ["招聘负责人A", "招聘负责人B", "招聘负责人C", "招聘负责人D", "招聘负责人E"];
const SAMPLE_REJECT_REASONS = ["期望薪资不匹配", "经验与岗位要求不匹配", "面试时间无法协调", "候选人接受其他机会", "业务方向匹配度不足"];

const ROLE_DEPARTMENT_MAP = {
  HR招聘实习生: "人力资源部",
  HRBP实习生: "人力资源部",
  人力资源助理: "人力资源部",
  项目管理实习生: "项目管理部",
  产品实习生: "产品部",
  产品运营实习生: "产品部",
  用户运营实习生: "运营部",
  内容运营实习生: "运营部",
  商业运营实习生: "运营部",
  销售助理: "销售部",
  市场分析实习生: "市场部",
  数据分析实习生: "数据分析部",
  研发助理: "研发部",
  技术支持实习生: "研发部",
  海外业务运营实习生: "海外业务部",
  跨境电商运营实习生: "海外业务部",
};

const SAMPLE_ROLE_COUNTS = [
  ["产品运营实习生", 12],
  ["HR招聘实习生", 9],
  ["跨境电商运营实习生", 9],
  ["用户运营实习生", 7],
  ["产品实习生", 7],
  ["市场分析实习生", 6],
  ["数据分析实习生", 5],
  ["海外业务运营实习生", 5],
  ["技术支持实习生", 4],
  ["研发助理", 4],
  ["销售助理", 3],
  ["HRBP实习生", 2],
  ["人力资源助理", 2],
  ["项目管理实习生", 2],
  ["内容运营实习生", 2],
  ["商业运营实习生", 1],
];

const SOURCE_CYCLE = [
  "BOSS直聘",
  "智联招聘",
  "BOSS直聘",
  "实习僧",
  "前程无忧",
  "BOSS直聘",
  "内推",
  "智联招聘",
  "猎聘",
  "校招官网",
  "微信社群",
  "LinkedIn",
];

const SOURCE_STAGE_PATTERNS = {
  BOSS直聘: [0, 1, 1, 2, 2, 3, 1, 2, 4, 0, 1, 5],
  智联招聘: [0, 1, 2, 1, 3, 2, 1, 4, 0, 2, 3, 5],
  前程无忧: [1, 1, 2, 3, 2, 4, 0, 1],
  实习僧: [2, 3, 4, 5, 1, 2, 5, 3],
  内推: [3, 4, 5, 2, 5, 3],
  猎聘: [2, 3, 4, 5, 3, 4],
  LinkedIn: [2, 3, 4, 5, 4],
  校招官网: [0, 1, 2, 3, 4, 1, 5],
  微信社群: [0, 1, 2, 3, 2, 4],
};

function formatSampleDate(date) {
  return date.toISOString().slice(0, 10);
}

function addSampleDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function createSamplePipelineDates(appliedDate, level, index) {
  const cadence = {
    screen: 2 + (index % 4),
    interview1: 7 + (index % 5),
    interview2: 14 + (index % 6),
    offer: 22 + (index % 7),
    hire: 32 + (index % 12),
  };

  return {
    applied_date: formatSampleDate(appliedDate),
    screen_date: level >= 1 ? formatSampleDate(addSampleDays(appliedDate, cadence.screen)) : "",
    interview1_date: level >= 2 ? formatSampleDate(addSampleDays(appliedDate, cadence.interview1)) : "",
    interview2_date: level >= 3 ? formatSampleDate(addSampleDays(appliedDate, cadence.interview2)) : "",
    offer_date: level >= 4 ? formatSampleDate(addSampleDays(appliedDate, cadence.offer)) : "",
    hire_date: level >= 5 ? formatSampleDate(addSampleDays(appliedDate, cadence.hire)) : "",
  };
}

function stageFromLevel(level) {
  return ["投递", "初筛", "一面", "二面", "Offer", "入职"][level] || "投递";
}

function createSampleRows() {
  const roleList = SAMPLE_ROLE_COUNTS.flatMap(([role, count]) => Array(count).fill(role));

  return roleList.map((role, index) => {
    const source = SOURCE_CYCLE[(index + Math.floor(index / 9)) % SOURCE_CYCLE.length];
    const sourcePattern = SOURCE_STAGE_PATTERNS[source] || [0, 1, 2, 3, 4, 5];
    const level = sourcePattern[(index + role.length) % sourcePattern.length];
    const isRejected = level < 5 && [11, 23, 37, 52, 66, 74].includes(index);
    const appliedDate = addSampleDays(new Date("2026-01-05T00:00:00"), index * 2 + (index % 4));

    return {
      candidate_id: `C-${String(index + 1).padStart(4, "0")}`,
      name: `Candidate ${String(index + 1).padStart(3, "0")}`,
      role,
      department: ROLE_DEPARTMENT_MAP[role] || "待确认",
      city: SAMPLE_CITIES[(index + Math.floor(index / 8)) % SAMPLE_CITIES.length],
      source,
      recruiter: SAMPLE_RECRUITERS[index % SAMPLE_RECRUITERS.length],
      current_stage: isRejected ? "淘汰" : stageFromLevel(level),
      ...createSamplePipelineDates(appliedDate, level, index),
      reject_reason: isRejected ? SAMPLE_REJECT_REASONS[index % SAMPLE_REJECT_REASONS.length] : "",
    };
  });
}

const SAMPLE_ROWS = createSampleRows();

const COLORS = ["#64748b", "#2563eb", "#0891b2", "#6d28d9", "#f97316", "#16a34a"];
const SOURCE_COLORS = {
  applications: "#94a3b8",
  interviews: "#0284c7",
  offers: "#f97316",
  hires: "#16a34a",
};
const SAMPLE_FILE_NAME = "示例数据.csv";
const TEMPLATE_FILE_NAME = "候选人台账模板.csv";
const FIELD_REQUIREMENTS = [
  ["candidate_id", "候选人编号"],
  ["name", "候选人名称"],
  ["role", "应聘岗位"],
  ["department", "部门"],
  ["city", "城市"],
  ["source", "招聘渠道"],
  ["recruiter", "招聘负责人"],
  ["current_stage", "当前阶段"],
  ["applied_date", "投递日期"],
  ["screen_date", "初筛日期"],
  ["interview1_date", "一面日期"],
  ["interview2_date", "二面日期"],
  ["offer_date", "Offer日期"],
  ["hire_date", "入职日期"],
  ["reject_reason", "淘汰/放弃原因"],
];
const COLUMN_ALIASES = {
  候选人编号: "candidate_id",
  编号: "candidate_id",
  候选人: "name",
  姓名: "name",
  候选人名称: "name",
  岗位: "role",
  应聘岗位: "role",
  部门: "department",
  城市: "city",
  渠道: "source",
  招聘渠道: "source",
  招聘负责人: "recruiter",
  负责人: "recruiter",
  当前阶段: "current_stage",
  阶段: "current_stage",
  投递日期: "applied_date",
  初筛日期: "screen_date",
  一面日期: "interview1_date",
  二面日期: "interview2_date",
  Offer日期: "offer_date",
  offer日期: "offer_date",
  入职日期: "hire_date",
  淘汰原因: "reject_reason",
  放弃原因: "reject_reason",
  "淘汰/放弃原因": "reject_reason",
};
const ROLE_OPTIONS = [
  "HR招聘实习生",
  "HRBP实习生",
  "人力资源助理",
  "产品实习生",
  "产品运营实习生",
  "用户运营实习生",
  "内容运营实习生",
  "商业运营实习生",
  "销售助理",
  "市场分析实习生",
  "数据分析实习生",
  "项目管理实习生",
  "研发助理",
  "技术支持实习生",
  "海外业务运营实习生",
  "跨境电商运营实习生",
  "待人工确认",
];
const STAGE_OPTIONS = ["投递", "初筛", "一面", "二面", "Offer", "入职", "面试中", "淘汰"];
const SOURCE_OPTIONS = ["BOSS直聘", "猎聘", "LinkedIn", "实习僧", "内推", "智联招聘", "前程无忧", "校招官网", "微信社群"];
const RECRUITER_OPTIONS = [...SAMPLE_RECRUITERS, "招聘团队"];
const LOCAL_STORAGE_KEY = "recruiting-funnel-analyzer-data-v2";
const STAGE_DISPLAY = {
  Applied: "投递",
  Screened: "初筛",
  "Interview 1": "一面",
  "Interview 2": "二面",
  Offered: "Offer",
  Hired: "入职",
  Rejected: "淘汰",
};

function displayStage(value) {
  return STAGE_DISPLAY[value] || value || "暂无";
}

function sourceForSummary(source) {
  const normalized = normalizeSource(source);
  return normalized === "LinkedIn" ? "领英" : normalized || "暂无";
}

function roleForSummary(role) {
  const roleNames = {
    HR招聘实习生: "招聘实习生",
    HRBP实习生: "人力资源业务伙伴实习生",
  };
  return roleNames[role] || role || "暂无";
}

function hasDate(value) {
  return Boolean(String(value || "").trim());
}

function normalizeSource(value) {
  const source = String(value || "").trim();
  if (!source) return "";
  return source.toLowerCase() === "boss直聘" ? "BOSS直聘" : source;
}

function normalizeStageValue(value) {
  const stage = String(value || "").trim();
  return STAGE_DISPLAY[stage] || stage;
}

function inferDepartment(role) {
  return ROLE_DEPARTMENT_MAP[role] || "待确认";
}

function parseDate(value) {
  if (!hasDate(value)) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  const text = String(value).trim();
  if (!text || text === "暂无") return null;
  const normalized = text.replace(/\//g, "-");
  const match = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);

  if (match) {
    const [, year, month, day] = match.map(Number);
    const date = new Date(year, month - 1, day);
    const isValid =
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day;
    return isValid ? date : null;
  }

  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeDate(value) {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return formatInputDate(parseDate(value));

  if (typeof value === "number" && Number.isFinite(value)) {
    if (value <= 0) return "";
    const utcDays = Math.floor(value - 25569);
    const utcValue = utcDays * 86400;
    const dateInfo = new Date(utcValue * 1000);
    if (Number.isNaN(dateInfo.getTime())) return "";
    return `${dateInfo.getUTCFullYear()}-${String(dateInfo.getUTCMonth() + 1).padStart(2, "0")}-${String(dateInfo.getUTCDate()).padStart(2, "0")}`;
  }

  const text = String(value).trim();
  if (!text || text === "暂无") return "";
  if (/^\d+(\.\d+)?$/.test(text)) return normalizeDate(Number(text));

  const parsed = parseDate(text);
  return parsed ? formatInputDate(parsed) : "";
}

function isInvalidDateValue(value) {
  return hasDate(value) && String(value).trim() !== "暂无" && !normalizeDate(value);
}

function validateRows(rows = [], missingColumns = [], fileType = "CSV/Excel") {
  const warnings = [];
  const safeRows = Array.isArray(rows) ? rows : [];
  const safeMissingColumns = Array.isArray(missingColumns) ? missingColumns : [];

  if (safeMissingColumns.length) {
    warnings.push(`${fileType}字段不完整，请检查模板。缺少字段：${safeMissingColumns.join("、")}。`);
  }

  const hasInvalidDate = safeRows.some((row) => DATE_COLUMNS.some((column) => isInvalidDateValue(row?.[column])));
  if (hasInvalidDate) {
    warnings.push("部分日期格式无法识别，请检查 applied_date、screen_date、interview1_date、interview2_date、offer_date、hire_date。");
  }

  return warnings;
}

function validateImportedRawRows(rawRows = [], headers = [], fileType = "CSV/Excel") {
  const warnings = [];
  const safeRows = Array.isArray(rawRows) ? rawRows : [];
  const safeHeaders = Array.isArray(headers) ? headers : [];
  const missingColumns = missingColumnsFromHeaders(safeHeaders);

  if (!safeRows.length) {
    warnings.push(`${fileType}内容为空，请检查文件或模板后重新上传。`);
  }

  if (missingColumns.length) {
    warnings.push(`${fileType}字段不完整，请检查模板。缺少字段：${missingColumns.join("、")}。`);
  }

  const hasInvalidDate = safeRows.some((row) => {
    const mapped = mapInputRow(row);
    return DATE_COLUMNS.some((column) => {
      const value = mapped[column];
      return hasDate(value) && String(value).trim() !== "暂无" && !normalizeDate(value);
    });
  });

  if (hasInvalidDate) {
    warnings.push("部分日期格式无法识别，请检查 applied_date、screen_date、interview1_date、interview2_date、offer_date、hire_date。");
  }

  return warnings;
}

function formatInputDate(date) {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getAppliedDateRange(rows, dateFilter) {
  const validDates = rows.map((row) => parseDate(row.applied_date)).filter(Boolean);
  if (!validDates.length) return { start: null, end: null };

  const latestDate = new Date(Math.max(...validDates.map((date) => date.getTime())));
  if (dateFilter.preset === "all") {
    return { start: null, end: null };
  }

  if (dateFilter.preset === "custom") {
    return {
      start: parseDate(dateFilter.startDate),
      end: parseDate(dateFilter.endDate),
    };
  }

  const days = Number(dateFilter.preset);
  const start = new Date(latestDate);
  start.setDate(start.getDate() - days + 1);
  return { start, end: latestDate };
}

function filterRowsByAppliedDate(rows, dateFilter) {
  const { start, end } = getAppliedDateRange(rows, dateFilter);
  if (!start && !end) return rows;

  return rows.filter((row) => {
    const appliedDate = parseDate(row.applied_date);
    if (!appliedDate) return false;
    if (start && appliedDate < start) return false;
    if (end && appliedDate > end) return false;
    return true;
  });
}

function daysBetween(startValue, endValue) {
  const start = parseDate(startValue);
  const end = parseDate(endValue);
  if (!start || !end) return null;
  const days = Math.round((end - start) / 86400000);
  if (days < 0 || days > 365) return null;
  return days;
}

function pct(numerator, denominator) {
  if (!denominator) return 0;
  return (numerator / denominator) * 100;
}

function formatPct(value) {
  return `${value.toFixed(value >= 10 ? 1 : 2)}%`;
}

function average(values = []) {
  const safeValues = Array.isArray(values) ? values : [];
  const clean = safeValues.filter((value) => Number.isFinite(value));
  if (!clean.length) return null;
  return clean.reduce((sum, value) => sum + value, 0) / clean.length;
}

function normalizeHeader(header) {
  const cleaned = String(header || "").trim().replace(/\s+/g, "");
  return COLUMN_ALIASES[cleaned] || cleaned;
}

function mapInputRow(row) {
  return Object.entries(row || {}).reduce((acc, [key, value]) => {
    const normalizedKey = normalizeHeader(key);
    acc[normalizedKey] = value;
    return acc;
  }, {});
}

function normalizeRow(row) {
  const extras = Object.entries(row || {}).reduce((acc, [key, value]) => {
    if (!REQUIRED_COLUMNS.includes(key)) acc[key] = value;
    return acc;
  }, {});

  return REQUIRED_COLUMNS.reduce((acc, key) => {
    const value = row?.[key];
    acc[key] = DATE_COLUMNS.includes(key) ? normalizeDate(value) : String(value ?? "").trim();
    return acc;
  }, extras);
}

function prepareImportedRows(rawRows = []) {
  const safeRows = Array.isArray(rawRows) ? rawRows : [];

  return safeRows
    .map((row) => normalizeRow(mapInputRow(row)))
    .filter((row) => row.candidate_id || row.name)
    .map((row, index) => ({
      ...row,
      candidate_id: row.candidate_id || `C-${String(index + 1).padStart(4, "0")}`,
      name: row.name || `Candidate ${String(index + 1).padStart(3, "0")}`,
      source: normalizeSource(row.source),
      current_stage: normalizeStageValue(row.current_stage),
      department: row.department || inferDepartment(row.role),
      reject_reason: row.reject_reason === "暂无" ? "" : row.reject_reason,
    }));
}

function missingColumnsFromHeaders(headers = []) {
  const safeHeaders = Array.isArray(headers) ? headers : [];
  const normalized = new Set(safeHeaders.map(normalizeHeader));
  return REQUIRED_COLUMNS.filter((column) => !normalized.has(column));
}

function maxCandidateNumber(rows = []) {
  return rows.reduce((max, row) => {
    const match = String(row?.candidate_id || "").match(/^C-(\d+)$/i);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
}

function formatCandidateId(number) {
  return `C-${String(number).padStart(4, "0")}`;
}

function ensureUniqueCandidateIds(rows = [], existingRows = []) {
  const safeRows = Array.isArray(rows) ? rows : [];
  const usedIds = new Set(
    (Array.isArray(existingRows) ? existingRows : [])
      .map((row) => String(row?.candidate_id || "").trim())
      .filter(Boolean)
  );
  let nextNumber = Math.max(maxCandidateNumber(existingRows), maxCandidateNumber(safeRows)) + 1;

  return safeRows.map((row) => {
    const currentId = String(row?.candidate_id || "").trim();
    let candidateId = currentId;

    if (!candidateId || usedIds.has(candidateId)) {
      do {
        candidateId = formatCandidateId(nextNumber);
        nextNumber += 1;
      } while (usedIds.has(candidateId));
    }

    usedIds.add(candidateId);
    return { ...row, candidate_id: candidateId };
  });
}

function duplicateText(value) {
  return String(value || "").trim().toLowerCase();
}

function parsedCandidateDuplicateKey(candidate) {
  const name = duplicateText(candidate?.name);
  const fileName = duplicateText(candidate?.file_name);
  const role = duplicateText(candidate?.suggested_role);
  const secondary = fileName && fileName !== duplicateText("待确认") ? fileName : role;
  return name && secondary ? `${name}::${secondary}` : "";
}

function ledgerCandidateDuplicateKey(row) {
  if (row?.ai_duplicate_key) return String(row.ai_duplicate_key);
  const name = duplicateText(row?.name);
  const fileName = duplicateText(row?.ai_source_file || row?.file_name);
  const role = duplicateText(row?.role);
  const secondary = fileName && fileName !== duplicateText("待确认") ? fileName : role;
  return name && secondary ? `${name}::${secondary}` : "";
}

function ledgerDuplicateKeySet(rows = []) {
  return new Set((Array.isArray(rows) ? rows : []).map(ledgerCandidateDuplicateKey).filter(Boolean));
}

function optionListWithCurrent(options, currentValue) {
  const cleanValue = String(currentValue || "").trim();
  return cleanValue && !options.includes(cleanValue) ? [cleanValue, ...options] : options;
}

function parsePastedTable(text) {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return { rows: [], warnings: ["粘贴内容不足，请至少包含表头和一行候选人数据。"] };

  const delimiter = lines[0].includes("\t") ? "\t" : ",";
  const headers = lines[0].split(delimiter).map((header) => header.trim());
  const rows = lines.slice(1).map((line) => {
    const cells = line.split(delimiter);
    return headers.reduce((acc, header, index) => {
      acc[header] = cells[index] || "";
      return acc;
    }, {});
  });
  const normalizedRows = prepareImportedRows(rows);
  return { rows: normalizedRows, warnings: validateImportedRawRows(rows, headers, "CSV/Excel") };
}

function groupBy(rows = [], key) {
  const safeRows = Array.isArray(rows) ? rows : [];

  return safeRows.reduce((acc, row) => {
    const value = row[key] || "未填写";
    if (!acc[value]) acc[value] = [];
    acc[value].push(row);
    return acc;
  }, {});
}

function countInterviews(rows) {
  return rows.filter((row) => hasDate(row.interview1_date) || hasDate(row.interview2_date)).length;
}

function calculateAnalytics(rows) {
  const stageData = STAGES.map((stage) => ({
    stage: stage.label,
    count: rows.filter((row) => hasDate(row[stage.key])).length,
  }));

  const conversionData = stageData.slice(0, -1).map((stage, index) => {
    const nextStage = stageData[index + 1];
    return {
      from: stage.stage,
      to: nextStage.stage,
      candidates: stage.count,
      progressed: nextStage.count,
      conversion: pct(nextStage.count, stage.count),
    };
  });

  const hired = rows.filter((row) => hasDate(row.hire_date));
  const hireTimes = hired.map((row) => daysBetween(row.applied_date, row.hire_date));
  const avgTimeToHire = average(hireTimes);

  const sourceData = Object.entries(groupBy(rows, "source"))
    .map(([source, sourceRows]) => {
      const applications = sourceRows.filter((row) => hasDate(row.applied_date)).length;
      const offers = sourceRows.filter((row) => hasDate(row.offer_date)).length;
      const hires = sourceRows.filter((row) => hasDate(row.hire_date)).length;
      const interviews = countInterviews(sourceRows);
      return {
        source,
        applications,
        interviews,
        offers,
        hires,
        interviewRate: pct(interviews, applications),
        offerRate: pct(offers, interviews),
        hireRate: pct(hires, applications),
      };
    })
    .sort((a, b) => b.hires - a.hires || b.applications - a.applications);

  const roleData = Object.entries(groupBy(rows, "role"))
    .map(([role, roleRows]) => {
      const applications = roleRows.filter((row) => hasDate(row.applied_date)).length;
      const offers = roleRows.filter((row) => hasDate(row.offer_date)).length;
      const hires = roleRows.filter((row) => hasDate(row.hire_date)).length;
      const timeToHire = average(roleRows.map((row) => daysBetween(row.applied_date, row.hire_date)));
      return {
        role,
        applications,
        interviews: countInterviews(roleRows),
        offers,
        hires,
        avgTimeToHire: timeToHire,
      };
    })
    .sort((a, b) => b.hires - a.hires || b.applications - a.applications);

  return {
    totalCandidates: rows.length,
    activeCandidates: rows.filter((row) => {
      const stage = String(row.current_stage || "").toLowerCase();
      return row.current_stage && !["rejected", "淘汰", "已淘汰"].includes(stage);
    }).length,
    hiredCount: hired.length,
    offerCount: rows.filter((row) => hasDate(row.offer_date)).length,
    overallHireRate: pct(hired.length, rows.filter((row) => hasDate(row.applied_date)).length),
    avgTimeToHire,
    stageData,
    conversionData,
    sourceData,
    roleData,
  };
}

function uniqueOptions(rows, key) {
  return [...new Set(rows.map((row) => row[key]).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function maxBy(items, score) {
  return items.reduce((best, item) => (score(item) > score(best) ? item : best), items[0]);
}

function joinChineseList(items, limit = 3) {
  const clean = items.filter(Boolean).slice(0, limit);
  if (!clean.length) return "暂无";
  if (clean.length === 1) return clean[0];
  return `${clean.slice(0, -1).join("、")}和${clean[clean.length - 1]}`;
}

function generateSummary(rows, analytics) {
  if (!rows.length) {
    return "上传候选人台账后，系统将自动生成基于招聘漏斗数据的周报摘要。";
  }

  const bestSource = maxBy(analytics.sourceData, (item) => item.hireRate || 0);
  const weakestConversion = analytics.conversionData.reduce(
    (lowest, item) => (item.conversion < lowest.conversion ? item : lowest),
    analytics.conversionData[0] || { from: "投递", to: "初筛", conversion: 0 }
  );
  const timeSentence =
    analytics.avgTimeToHire === null
      ? "当前有效入职周期数据不足，暂不计算平均招聘周期。"
      : `平均招聘周期为${analytics.avgTimeToHire.toFixed(1)}天。`;
  const rolesWithHire = analytics.roleData.filter((role) => role.hires > 0);
  const maxHire = rolesWithHire.length ? Math.max(...rolesWithHire.map((role) => role.hires)) : 0;
  const leadingRoles = rolesWithHire.filter((role) => role.hires === maxHire).map((role) => roleForSummary(role.role));
  const roleObservation =
    leadingRoles.length >= 3
      ? `从岗位维度看，${joinChineseList(leadingRoles)}等岗位均已有入职进展，说明当前招聘结果分布较为分散。`
      : leadingRoles.length
        ? `从岗位维度看，${joinChineseList(leadingRoles)}的入职进展相对更明确，后续可继续关注同类岗位的候选人供给。`
        : "从岗位维度看，当前筛选范围内尚未形成明确入职结果，建议重点推进已进入面试和Offer阶段的候选人。";

  return `当前筛选条件下共纳入${analytics.totalCandidates}名候选人，总体入职率为${formatPct(
    analytics.overallHireRate
  )}。${timeSentence}表现较好的渠道是${sourceForSummary(bestSource?.source)}，该渠道入职转化率为${formatPct(
    bestSource?.hireRate || 0
  )}。当前主要流失环节为“${weakestConversion.from} → ${weakestConversion.to}”，该阶段转化率为${formatPct(
    weakestConversion.conversion
  )}。${roleObservation} 下一步建议优先复盘低转化环节的候选人体验、渠道质量和业务反馈节奏，并对高需求岗位保持稳定候选人补充。`;
}

function generateRoleInsight(analytics) {
  if (!analytics.roleData.length) {
    return "当前筛选条件下暂无岗位数据，无法生成岗位观察。";
  }

  const highDemandRoles = analytics.roleData
    .slice()
    .sort((a, b) => b.applications - a.applications)
    .slice(0, 3)
    .map((item) => roleForSummary(item.role));
  const longCycleRoles = analytics.roleData
    .filter((item) => item.avgTimeToHire !== null)
    .sort((a, b) => b.avgTimeToHire - a.avgTimeToHire)
    .slice(0, 2)
    .map((item) => roleForSummary(item.role));

  const demandText = `从岗位维度看，${joinChineseList(highDemandRoles)}方向的招聘需求相对更高。`;
  const cycleText = longCycleRoles.length
    ? `${joinChineseList(longCycleRoles)}的平均招聘周期相对较长，后续需要关注岗位要求与候选人供给的匹配度。`
    : "当前暂无可计算招聘周期的入职数据，建议持续积累投递到入职的完整链路信息。";

  return `${demandText}${cycleText}`;
}

function generateBottleneckDiagnosis(analytics) {
  if (!analytics.conversionData.length) {
    return "暂无足够数据识别招聘瓶颈。";
  }

  const weakest = analytics.conversionData.reduce((lowest, item) => (item.conversion < lowest.conversion ? item : lowest));
  const pair = `${weakest.from} → ${weakest.to}`;
  const suggestions = {
    "投递 → 初筛": "可能说明渠道投放与岗位画像匹配度不足，或职位描述吸引来的简历质量不稳定。",
    "初筛 → 一面": "可能说明岗位要求过窄、简历质量不足，或初筛标准与业务部门需求不完全一致。",
    "一面 → 二面": "可能说明一面评价标准偏严格，候选人能力结构与岗位核心要求存在差距，或面试反馈口径需要进一步统一。",
    "二面 → Offer": "可能说明终面决策链路较长、薪资预算与候选人预期存在差距，或候选人与团队匹配度需要更早确认。",
    "Offer → 入职": "可能说明录用意向接受率偏低，需关注薪酬竞争力、候选人等待周期、背调流程和竞品机会影响。",
  };

  return `当前最低转化环节为“${pair}”，转化率为${formatPct(weakest.conversion)}。${
    suggestions[pair] || "建议结合岗位画像、渠道来源、面试反馈和候选人放弃原因进一步复盘。"
  }`;
}

function generateSourceRecommendation(analytics) {
  if (!analytics.sourceData.length) {
    return "暂无足够数据生成渠道建议。";
  }

  const mostCandidates = maxBy(analytics.sourceData, (item) => item.applications || 0);
  const bestInterview = maxBy(analytics.sourceData, (item) => item.interviewRate || 0);
  const bestOffer = maxBy(analytics.sourceData, (item) => item.offerRate || 0);
  const bestHire = maxBy(analytics.sourceData, (item) => item.hireRate || 0);
  const volumeQualityText =
    mostCandidates.source === bestHire.source
      ? `${sourceForSummary(mostCandidates.source)}同时具备较高投递量和较好的入职转化，可作为重点维护渠道。`
      : `${sourceForSummary(mostCandidates.source)}带来的候选人数量最多，但${sourceForSummary(
          bestHire.source
        )}的入职转化率更高，说明渠道规模和渠道质量并不完全一致。`;

  return `${volumeQualityText} 从转化结构看，投递量最高的渠道是${sourceForSummary(mostCandidates.source)}，共${mostCandidates.applications}人；面试转化率最高的渠道是${sourceForSummary(
    bestInterview.source
  )}，达到${formatPct(bestInterview.interviewRate)}；录用意向转化率最高的渠道是${sourceForSummary(bestOffer.source)}，达到${formatPct(
    bestOffer.offerRate
  )}；入职转化率最高的渠道是${sourceForSummary(bestHire.source)}，达到${formatPct(
    bestHire.hireRate
  )}。建议将高转化渠道用于关键岗位补充，同时对高流量低转化渠道优化职位描述、筛选标准和投放人群。`;
}

function generateRiskAlerts(rows, analytics) {
  if (!rows.length) {
    return ["当前筛选条件下暂无候选人数据，请调整时间范围或筛选条件后再查看风险提醒。"];
  }

  const alerts = [];
  const offerToHire = analytics.conversionData.find((item) => item.from === "Offer" && item.to === "入职");
  const weakest = analytics.conversionData.reduce(
    (lowest, item) => (item.conversion < lowest.conversion ? item : lowest),
    analytics.conversionData[0] || { from: "投递", to: "初筛", conversion: 0 }
  );

  if (offerToHire && offerToHire.conversion < 65) {
    alerts.push("Offer → 入职转化率偏低，建议关注薪资竞争力、候选人等待周期和Offer沟通效率。");
  } else if (weakest) {
    alerts.push(`${weakest.from} → ${weakest.to}是当前转化最低环节，建议优先复盘该阶段的筛选口径和候选人体验。`);
  }

  const highVolumeSource = maxBy(analytics.sourceData, (item) => item.applications || 0);
  if (highVolumeSource && highVolumeSource.applications >= 5 && highVolumeSource.hireRate < analytics.overallHireRate) {
    alerts.push(
      `${sourceForSummary(highVolumeSource.source)}候选人量较高，但最终入职转化率低于整体水平，建议优化JD描述、投放人群和初筛标准。`
    );
  }

  const longCycleRole = analytics.roleData
    .filter((item) => item.avgTimeToHire !== null)
    .sort((a, b) => b.avgTimeToHire - a.avgTimeToHire)[0];
  if (longCycleRole && analytics.avgTimeToHire !== null && longCycleRole.avgTimeToHire > analytics.avgTimeToHire + 3) {
    alerts.push(
      `${roleForSummary(longCycleRole.role)}平均招聘周期较长，可能说明岗位要求较高、候选人供给不足或面试排期效率需要提升。`
    );
  }

  const stagedRoles = Object.entries(groupBy(rows, "role"))
    .map(([role, roleRows]) => ({
      role,
      count: roleRows.filter((row) => ["初筛", "一面", "Screened", "Interview 1"].includes(row.current_stage)).length,
    }))
    .sort((a, b) => b.count - a.count);
  const stuckRole = stagedRoles.find((item) => item.count >= 3);
  if (stuckRole) {
    alerts.push(`${roleForSummary(stuckRole.role)}有较多候选人停留在初筛或一面阶段，建议与业务部门确认筛选标准是否过窄。`);
  }

  if (alerts.length < 2 && analytics.sourceData.length) {
    const bestSource = maxBy(analytics.sourceData, (item) => item.hireRate || 0);
    if (bestSource.hireRate > 0) {
      alerts.push(`${sourceForSummary(bestSource.source)}当前入职转化相对较好，建议沉淀该渠道的人才画像并复用到相似岗位。`);
    } else {
      alerts.push("当前时间范围内尚未产生入职转化，建议重点跟进已进入面试和Offer阶段的候选人推进节奏。");
    }
  }

  if (alerts.length < 2) {
    alerts.push("当前筛选范围内暂未发现明显异常，建议持续关注阶段转化率、招聘周期和渠道质量变化。");
  }

  return [...new Set(alerts)].slice(0, 4);
}

function stageClassName(stage) {
  const label = displayStage(stage);
  const classMap = {
    投递: "stage-applied",
    初筛: "stage-screened",
    一面: "stage-interview1",
    二面: "stage-interview2",
    Offer: "stage-offer",
    入职: "stage-hired",
    面试中: "stage-interview1",
    淘汰: "stage-rejected",
  };
  return `stage-badge ${classMap[label] || "stage-unknown"}`;
}

function downloadCsvFile(rows, columns, filename) {
  const csv = Papa.unparse(rows, { columns });
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function todayText() {
  return formatInputDate(new Date());
}

function arrayText(value) {
  return Array.isArray(value) ? value.join("、") : String(value || "暂无");
}

function normalizeParsedCandidate(candidate, index) {
  return {
    candidate_id: candidate.candidate_id || `R-${String(index + 1).padStart(4, "0")}`,
    name: candidate.name || `Candidate ${String(index + 1).padStart(3, "0")}`,
    education_level: candidate.education_level || "待确认",
    school: candidate.school || "待确认",
    major: candidate.major || "待确认",
    graduation_year: candidate.graduation_year || "待确认",
    skills: Array.isArray(candidate.skills) ? candidate.skills : [],
    experience_keywords: Array.isArray(candidate.experience_keywords) ? candidate.experience_keywords : [],
    suggested_role: ROLE_OPTIONS.includes(candidate.suggested_role) ? candidate.suggested_role : "待人工确认",
    fit_reason: candidate.fit_reason || "待人工确认",
    missing_information: Array.isArray(candidate.missing_information) ? candidate.missing_information : [],
    source: normalizeSource(candidate.source) || "待确认",
    recruiter: candidate.recruiter || SAMPLE_RECRUITERS[0],
    current_stage: displayStage(candidate.current_stage || "投递"),
    applied_date: candidate.applied_date === "today" || !candidate.applied_date ? todayText() : candidate.applied_date,
    reject_reason: candidate.reject_reason || "暂无",
    file_name: candidate.file_name || "待确认",
    added_to_ledger: Boolean(candidate.added_to_ledger),
  };
}

function parsedCandidateToPipeline(candidate) {
  const role = candidate.suggested_role === "待人工确认" ? "待人工确认" : candidate.suggested_role;
  return {
    candidate_id: "",
    name: candidate.name,
    role,
    department: inferDepartment(role),
    city: "待确认",
    source: normalizeSource(candidate.source) || "待确认",
    recruiter: candidate.recruiter || SAMPLE_RECRUITERS[0],
    current_stage: displayStage(candidate.current_stage || "投递"),
    applied_date: candidate.applied_date || todayText(),
    screen_date: "",
    interview1_date: "",
    interview2_date: "",
    offer_date: "",
    hire_date: "",
    reject_reason: candidate.reject_reason || "暂无",
    ai_source_file: candidate.file_name || "",
    ai_duplicate_key: parsedCandidateDuplicateKey(candidate),
  };
}

function StatCard({ icon, label, value, note, description }) {
  return (
    <section className="stat-card">
      <div className="stat-icon">
        <span>{icon}</span>
      </div>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <span>{note}</span>
        <small>{description}</small>
      </div>
    </section>
  );
}

function DataTable({ columns, rows, emptyText = "暂无数据。" }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((row, index) => (
              <tr key={row.id || row.candidate_id || `${row.source || row.role || row.from}-${index}`}>
                {columns.map((column) => (
                  <td key={column.key}>{column.render ? column.render(row) : row[column.key]}</td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="empty-cell">
                {emptyText}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function FilterSelect({ label, value, options, onChange }) {
  return (
    <label className="filter-control">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">全部</option>
        {options.map((option) => (
          <option value={option} key={option}>
            {displayStage(option)}
          </option>
        ))}
      </select>
    </label>
  );
}

function DateRangeFilter({ dateFilter, rows, filteredCount, onChange }) {
  const range = getAppliedDateRange(rows, dateFilter);
  const rangeText =
    range.start || range.end
      ? `${range.start ? formatInputDate(range.start) : "最早"} 至 ${range.end ? formatInputDate(range.end) : "最新"}`
      : "全部投递日期";

  return (
    <section className="panel date-filter-panel">
      <div className="panel-header">
        <div>
          <span className="eyebrow">时间筛选</span>
          <h2>按投递日期筛选分析范围</h2>
        </div>
        <div className="date-filter-count">{filteredCount}条记录</div>
      </div>
      <div className="date-filter-grid">
        <label className="filter-control">
          <span>时间范围</span>
          <select value={dateFilter.preset} onChange={(event) => onChange({ ...dateFilter, preset: event.target.value })}>
            <option value="all">全部时间</option>
            <option value="7">最近7天</option>
            <option value="30">最近30天</option>
            <option value="90">最近90天</option>
            <option value="custom">自定义时间</option>
          </select>
        </label>
        <label className="filter-control">
          <span>自定义开始日期</span>
          <input
            type="date"
            value={dateFilter.startDate}
            onChange={(event) => onChange({ ...dateFilter, preset: "custom", startDate: event.target.value })}
            onInput={(event) => onChange({ ...dateFilter, preset: "custom", startDate: event.target.value })}
          />
        </label>
        <label className="filter-control">
          <span>自定义结束日期</span>
          <input
            type="date"
            value={dateFilter.endDate}
            onChange={(event) => onChange({ ...dateFilter, preset: "custom", endDate: event.target.value })}
            onInput={(event) => onChange({ ...dateFilter, preset: "custom", endDate: event.target.value })}
          />
        </label>
        <button type="button" className="clear-button" onClick={() => onChange({ preset: "all", startDate: "", endDate: "" })}>
          <span className="button-icon">重置</span>
          全部时间
        </button>
      </div>
      <p className="date-range-text">当前分析范围：{rangeText}</p>
    </section>
  );
}

function UploadPanel({ onRowsLoaded, fileName, error, dataSource }) {
  function downloadTemplateCsv() {
    downloadCsvFile([], REQUIRED_COLUMNS, TEMPLATE_FILE_NAME);
  }

  function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const extension = file.name.split(".").pop().toLowerCase();
    if (extension === "xlsx") {
      if (!window.XLSX) {
        onRowsLoaded([], file.name, ["Excel解析库加载失败，请刷新页面后重试。"], "upload");
        return;
      }

      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        try {
          const workbook = XLSX.read(readerEvent.target.result, { type: "array", cellDates: false });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
          const headers = rawRows.length ? Object.keys(rawRows[0]) : [];
          const normalized = prepareImportedRows(rawRows);
          onRowsLoaded(normalized, file.name, validateImportedRawRows(rawRows, headers, "CSV/Excel"), "upload");
        } catch (error) {
          onRowsLoaded([], file.name, ["Excel文件解析失败，请检查文件格式或另存为CSV后重试。"], "upload");
        }
      };
      reader.onerror = () => onRowsLoaded([], file.name, ["Excel文件读取失败，请重新选择文件。"], "upload");
      reader.readAsArrayBuffer(file);
      event.target.value = "";
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const fields = results.meta.fields || [];
        const normalized = prepareImportedRows(results.data);
        onRowsLoaded(normalized, file.name, validateImportedRawRows(results.data, fields, "CSV/Excel"), "upload");
      },
      error: () => onRowsLoaded([], file.name, ["CSV解析失败，请检查文件格式后重试。"], "upload"),
    });
    event.target.value = "";
  }

  return (
    <section className="upload-panel">
      <div>
        <span className="eyebrow">招聘数据分析</span>
        <h1>招聘漏斗分析仪</h1>
        <p>
          上传候选人台账，自动计算招聘阶段人数、转化率、渠道质量、岗位表现和招聘周期。
        </p>
        <p className="creator-line">制作人：Wenkai Zhu</p>
      </div>
      <aside className="start-card">
        <div className="start-card-header">
          <span className="eyebrow">开始使用</span>
          <h2>开始使用</h2>
          <p>建议先加载示例数据查看分析效果，再下载模板并上传自己的候选人台账。</p>
        </div>
        <input id="csv-file" type="file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={handleFile} />
        <div className="start-steps">
          <div className="start-step">
            <div>
              <strong>① 加载示例数据</strong>
              <p>快速查看完整分析效果。</p>
            </div>
            <button type="button" onClick={() => onRowsLoaded(SAMPLE_ROWS, SAMPLE_FILE_NAME, [], "sample")}>
              加载示例数据
            </button>
          </div>

          <div className="start-step">
            <div>
              <strong>② 下载台账模板</strong>
              <p>按标准字段准备自己的候选人数据。</p>
            </div>
            <button type="button" onClick={downloadTemplateCsv}>
              下载模板CSV
            </button>
          </div>

          <div className="start-step">
            <div>
              <strong>③ 上传Excel/CSV台账</strong>
              <p>导入已有候选人数据。</p>
            </div>
            <label htmlFor="csv-file">上传Excel/CSV候选人台账</label>
          </div>

          <div className="start-step passive-step">
            <div>
              <strong>④ 粘贴Excel表格</strong>
              <p>直接复制现有Excel表格内容。</p>
            </div>
            <span>见下方导入区</span>
          </div>

          <div className="start-step passive-step">
            <div>
              <strong>⑤ AI解析简历</strong>
              <p>从简历中提取候选人信息并生成台账记录。</p>
            </div>
            <span>见下方解析区</span>
          </div>
        </div>

        <p className="csv-help">CSV是一种可由Excel打开和编辑的表格文件格式。建议先下载模板，再替换为自己的候选人数据。</p>
        <details className="field-requirements">
          <summary>查看字段要求</summary>
          <dl>
            {FIELD_REQUIREMENTS.map(([field, description]) => (
              <div key={field}>
                <dt>{field}：</dt>
                <dd>{description}</dd>
              </div>
            ))}
          </dl>
        </details>
        <div className="data-source-indicator">当前数据来源：{dataSource}</div>
        {fileName ? <span className="file-name">当前文件：{fileName}</span> : null}
        {error ? <small className="error">{error}</small> : null}
      </aside>
    </section>
  );
}

function DataWorkflowPanel({ rows, onRowsLoaded, onSaveLocal, onLoadLocal, onClearLocal, localMessage }) {
  const [pasteText, setPasteText] = useState("");
  const [pendingRows, setPendingRows] = useState([]);
  const [pasteWarnings, setPasteWarnings] = useState([]);

  function parsePastedRows() {
    const result = parsePastedTable(pasteText);
    setPendingRows(result.rows);
    setPasteWarnings(result.warnings);
  }

  function confirmPastedRows() {
    if (!pendingRows.length) {
      setPasteWarnings(["暂无可导入的粘贴数据，请先解析粘贴内容。"]);
      return;
    }
    onRowsLoaded(pendingRows, "粘贴Excel表格", pasteWarnings, "upload");
    setPasteText("");
    setPendingRows([]);
    setPasteWarnings([]);
  }

  return (
    <section className="grid two-col workflow-grid">
      <article className="panel paste-panel">
        <div className="panel-header">
          <div>
            <span className="eyebrow">粘贴Excel表格</span>
            <h2>复制现有表格快速导入</h2>
          </div>
        </div>
        <p className="panel-description">从Excel复制包含表头的候选人台账，粘贴到下方后点击解析。支持中文字段名自动映射到系统字段。</p>
        <textarea
          value={pasteText}
          onChange={(event) => setPasteText(event.target.value)}
          placeholder="请粘贴从Excel复制的候选人台账内容，第一行应为字段名。"
        />
        <div className="action-row">
          <button type="button" onClick={parsePastedRows}>解析粘贴数据</button>
          <button type="button" onClick={confirmPastedRows} disabled={!pendingRows.length}>确认导入粘贴数据</button>
        </div>
        {pendingRows.length ? <p className="success-text">已解析{pendingRows.length}条候选人记录，确认后将更新主看板。</p> : null}
        {pasteWarnings.length ? <p className="warning-text">{pasteWarnings.join(" ")}</p> : null}
      </article>

      <article className="panel local-panel">
        <div className="panel-header">
          <div>
            <span className="eyebrow">本地数据管理</span>
            <h2>浏览器本地保存</h2>
          </div>
        </div>
        <p className="panel-description">所有候选人台账分析均在浏览器本地完成。AI简历解析仅在用户主动点击解析时调用本地API代理，不会用于自动筛选、排序或录用决策。</p>
        <div className="local-actions">
          <button type="button" onClick={() => onSaveLocal(rows)}>保存当前数据到本地</button>
          <button type="button" onClick={onLoadLocal}>读取本地保存数据</button>
          <button type="button" onClick={onClearLocal}>清空本地保存数据</button>
        </div>
        {localMessage ? <p className="success-text">{localMessage}</p> : null}
      </article>
    </section>
  );
}

function ResumeParserPanel({ parsedCandidates, setParsedCandidates, onAddCandidates, ledgerRows }) {
  const [resumeFiles, setResumeFiles] = useState([]);
  const [resumeMessage, setResumeMessage] = useState("");
  const [resumeStatuses, setResumeStatuses] = useState([]);
  const [isParsing, setIsParsing] = useState(false);
  const ledgerKeys = useMemo(() => ledgerDuplicateKeySet(ledgerRows), [ledgerRows]);

  function isParsedCandidateAdded(candidate) {
    return Boolean(candidate.added_to_ledger) || ledgerKeys.has(parsedCandidateDuplicateKey(candidate));
  }

  function readTextFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(String(event.target.result || ""));
      reader.onerror = () => reject(new Error("文件读取失败"));
      reader.readAsText(file, "utf-8");
    });
  }

  function readArrayBufferFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target.result);
      reader.onerror = () => reject(new Error("文件读取失败"));
      reader.readAsArrayBuffer(file);
    });
  }

  function updateResumeStatus(fileId, status, type = "info") {
    setResumeStatuses((current) =>
      current.map((item) => (item.id === fileId ? { ...item, status, type } : item))
    );
  }

  function getResumeExtension(fileName) {
    return String(fileName || "").split(".").pop().toLowerCase();
  }

  async function extractTxtResume(file) {
    const text = (await readTextFile(file)).trim();
    if (!text) throw new Error("该TXT文件未能提取到有效文本，请检查文件内容后重试。");
    return text;
  }

  async function extractDocxResume(file) {
    if (!window.mammoth?.extractRawText) {
      throw new Error("DOCX解析库加载失败，请刷新页面后重试。");
    }

    const arrayBuffer = await readArrayBufferFile(file);
    const result = await window.mammoth.extractRawText({ arrayBuffer });
    const text = String(result.value || "").trim();
    if (!text) throw new Error("该DOCX文件未能提取到有效文本，请检查文件内容后重试。");
    return text;
  }

  async function extractPdfResume(file) {
    if (!window.pdfjsLib?.getDocument) {
      throw new Error("PDF解析库加载失败，请刷新页面后重试。");
    }

    window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js";
    const arrayBuffer = await readArrayBufferFile(file);
    const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pageTexts = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const text = content.items.map((item) => item.str || "").join(" ").trim();
      if (text) pageTexts.push(text);
    }

    const text = pageTexts.join("\n").trim();
    if (!text) {
      throw new Error("该PDF可能是扫描版或图片版，暂时无法提取文字。请上传文字版PDF、DOCX或TXT文件。");
    }
    return text;
  }

  async function extractResumeText(resume) {
    if (resume.extension === "txt") return extractTxtResume(resume.file);
    if (resume.extension === "docx") return extractDocxResume(resume.file);
    if (resume.extension === "pdf") return extractPdfResume(resume.file);
    throw new Error("文件格式暂不支持，请上传PDF、DOCX或TXT文件。");
  }

  async function handleResumeFiles(event) {
    const files = Array.from(event.target.files || []);
    const supportedExtensions = ["pdf", "docx", "txt"];
    const prepared = [];
    const warnings = [];

    files.forEach((file, index) => {
      const extension = getResumeExtension(file.name);
      const id = `${file.name}-${file.size}-${file.lastModified}-${index}`;
      if (supportedExtensions.includes(extension)) {
        prepared.push({ id, name: file.name, file, extension, status: "待解析" });
      } else {
        warnings.push(`${file.name}格式暂不支持，请上传PDF、DOCX或TXT文件。`);
      }
    });

    setResumeFiles(prepared);
    setResumeStatuses([
      ...prepared.map((file) => ({ id: file.id, name: file.name, status: "待解析", type: "info" })),
      ...warnings.map((warning, index) => ({ id: `warning-${index}`, name: "文件提醒", status: warning, type: "warning" })),
    ]);
    setResumeMessage(
      [
        prepared.length ? `已选择${prepared.length}个简历文件，点击“解析简历”开始处理。` : "",
        ...warnings,
      ]
        .filter(Boolean)
        .join(" ")
    );
    event.target.value = "";
  }

  async function parseResumes() {
    if (!resumeFiles.length) {
      setResumeMessage("请先上传PDF、DOCX或TXT简历文件。");
      return;
    }

    setIsParsing(true);
    const nextCandidates = [];
    const warnings = [];
    setResumeMessage("正在读取文件……");

    for (const [index, resume] of resumeFiles.entries()) {
      try {
        updateResumeStatus(resume.id, "正在读取文件……");
        updateResumeStatus(resume.id, "正在提取简历文本……");
        const resumeText = await extractResumeText(resume);
        updateResumeStatus(resume.id, "正在调用AI解析……");
        setResumeMessage(`正在调用AI解析：${resume.name}`);

        const response = await fetch("/api/parse-resume", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resumeText, fileName: resume.name, index }),
        });
        const payload = await response.json();
        if (!response.ok) {
          const message = payload.error || `${resume.name}解析失败，请检查文件格式或稍后重试。`;
          warnings.push(`${resume.name}：${message}`);
          updateResumeStatus(resume.id, message, "warning");
          continue;
        }
        nextCandidates.push(
          normalizeParsedCandidate(
            { ...payload.candidate, file_name: resume.name },
            parsedCandidates.length + nextCandidates.length
          )
        );
        updateResumeStatus(resume.id, "解析完成", "success");
      } catch (error) {
        const message = error.message || "解析失败，请检查文件格式或稍后重试。";
        warnings.push(`${resume.name}：${message}`);
        updateResumeStatus(resume.id, message, "warning");
      }
    }

    setParsedCandidates((current) => [...current, ...nextCandidates]);
    setResumeMessage(
      [nextCandidates.length ? `解析完成，已生成${nextCandidates.length}条候选人解析记录，请人工复核后再加入台账。` : "", ...warnings]
        .filter(Boolean)
        .join(" ")
    );
    setIsParsing(false);
  }

  function updateParsedCandidate(index, key, value) {
    setParsedCandidates((current) =>
      current.map((candidate, candidateIndex) => (candidateIndex === index ? { ...candidate, [key]: value } : candidate))
    );
  }

  function addCandidatesToPipeline(candidates = parsedCandidates) {
    const candidatesToAdd = candidates.filter((candidate) => !isParsedCandidateAdded(candidate));

    if (!candidates.length) {
      setResumeMessage("暂无可加入候选人台账的解析结果。");
      return;
    }

    if (!candidatesToAdd.length) {
      setResumeMessage("该候选人已在台账中，请勿重复加入。");
      return;
    }

    const result = onAddCandidates(candidatesToAdd);
    if (result?.addedKeys?.size) {
      setParsedCandidates((current) =>
        current.map((candidate) =>
          result.addedKeys.has(parsedCandidateDuplicateKey(candidate))
            ? { ...candidate, added_to_ledger: true }
            : candidate
        )
      );
    }

    const messages = [];
    if (result?.addedCount) {
      messages.push(`已将${result.addedCount}条解析结果加入候选人台账，所有分析已自动更新。`);
    }
    if (result?.duplicateCount || candidatesToAdd.length < candidates.length) {
      messages.push("该候选人已在台账中，请勿重复加入。");
    }
    setResumeMessage(messages.join(" "));
  }

  function exportParsedCsv() {
    if (!parsedCandidates.length) {
      setResumeMessage("暂无可导出的解析结果。");
      return;
    }
    const exportRows = parsedCandidates.map((candidate) => ({
      candidate_id: candidate.candidate_id,
      name: candidate.name,
      education_level: candidate.education_level,
      school: candidate.school,
      major: candidate.major,
      graduation_year: candidate.graduation_year,
      skills: arrayText(candidate.skills),
      experience_keywords: arrayText(candidate.experience_keywords),
      suggested_role: candidate.suggested_role,
      fit_reason: candidate.fit_reason,
      missing_information: arrayText(candidate.missing_information),
      source: candidate.source,
      recruiter: candidate.recruiter,
      current_stage: candidate.current_stage,
      applied_date: candidate.applied_date,
      reject_reason: candidate.reject_reason,
      file_name: candidate.file_name || "待确认",
    }));
    downloadCsvFile(exportRows, Object.keys(exportRows[0]), "AI简历解析结果.csv");
  }

  return (
    <section className="panel resume-panel">
      <div className="panel-header">
        <div>
          <span className="eyebrow">AI简历解析与候选人台账生成</span>
          <h2>AI简历解析与候选人台账生成</h2>
        </div>
      </div>
      <div className="resume-copy">
        <p>上传候选人简历后，系统会使用 AI 提取教育背景、技能关键词、经历关键词和可能匹配的岗位方向，并生成候选人台账记录。该功能仅用于信息整理，不用于自动筛选、候选人排序、自动淘汰或录用决策。</p>
        <p>支持 PDF、DOCX 和 TXT 简历文件。系统会先提取简历文本，再使用 AI 生成候选人台账记录。</p>
        <p className="privacy-note">请勿在公开演示中上传真实候选人简历。建议使用虚拟或脱敏简历进行测试。</p>
        <p className="privacy-note">AI解析结果仅用于HR整理台账和初步了解候选人背景，不代表录用建议，也不应作为自动筛选、排序或淘汰候选人的依据。</p>
      </div>
      <div className="resume-actions">
        <label htmlFor="resume-files">上传简历文件</label>
        <input id="resume-files" type="file" multiple accept=".pdf,.docx,.txt" onChange={handleResumeFiles} />
        <button type="button" onClick={parseResumes} disabled={isParsing}>{isParsing ? "解析中..." : "解析简历"}</button>
        <button type="button" onClick={() => addCandidatesToPipeline()}>加入候选人台账</button>
        <button type="button" onClick={exportParsedCsv}>导出解析结果CSV</button>
        <button type="button" onClick={() => setParsedCandidates([])}>清空解析结果</button>
      </div>
      {resumeFiles.length ? <p className="success-text">已选择{resumeFiles.length}个可解析简历文件。</p> : null}
      {resumeMessage ? (
        <p className={resumeMessage.includes("失败") || resumeMessage.includes("未检测") || resumeMessage.includes("暂不支持") || resumeMessage.includes("无法") || resumeMessage.includes("未能") ? "warning-text" : "success-text"}>
          {resumeMessage}
        </p>
      ) : null}
      {resumeStatuses.length ? (
        <ul className="resume-status-list">
          {resumeStatuses.map((item) => (
            <li key={item.id} className={item.type === "warning" ? "warning-status" : item.type === "success" ? "success-status" : ""}>
              <span>{item.name}</span>
              <strong>{item.status}</strong>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="table-wrap parsed-table-wrap">
        <table>
          <thead>
            <tr>
              {["候选人编号", "候选人名称", "学校", "学历", "专业", "毕业年份", "技能关键词", "经历关键词", "建议岗位", "匹配理由", "信息缺口", "文件名", "招聘渠道", "招聘负责人", "当前阶段", "投递日期", "操作"].map((header) => (
                <th key={header}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {parsedCandidates.length ? (
              parsedCandidates.map((candidate, index) => {
                const added = isParsedCandidateAdded(candidate);
                return (
                    <tr key={`${candidate.candidate_id}-${index}`}>
                      <td>{candidate.candidate_id}</td>
                      <td><input value={candidate.name} onChange={(event) => updateParsedCandidate(index, "name", event.target.value)} /></td>
                      <td>{candidate.school}</td>
                      <td>{candidate.education_level}</td>
                      <td>{candidate.major}</td>
                      <td>{candidate.graduation_year}</td>
                      <td>{arrayText(candidate.skills)}</td>
                      <td>{arrayText(candidate.experience_keywords)}</td>
                      <td>
                        <select value={candidate.suggested_role} onChange={(event) => updateParsedCandidate(index, "suggested_role", event.target.value)}>
                          {ROLE_OPTIONS.map((role) => <option key={role} value={role}>{role}</option>)}
                        </select>
                      </td>
                      <td>{candidate.fit_reason}</td>
                      <td>{arrayText(candidate.missing_information)}</td>
                      <td>{candidate.file_name || "待确认"}</td>
                      <td><input value={candidate.source} onChange={(event) => updateParsedCandidate(index, "source", normalizeSource(event.target.value))} /></td>
                      <td><input value={candidate.recruiter} onChange={(event) => updateParsedCandidate(index, "recruiter", event.target.value)} /></td>
                      <td>
                        <select value={candidate.current_stage} onChange={(event) => updateParsedCandidate(index, "current_stage", event.target.value)}>
                          {STAGE_OPTIONS.map((stage) => <option key={stage} value={stage}>{stage}</option>)}
                        </select>
                      </td>
                      <td><input type="date" value={candidate.applied_date} onChange={(event) => updateParsedCandidate(index, "applied_date", event.target.value)} /></td>
                      <td>
                        <button type="button" disabled={added} onClick={() => addCandidatesToPipeline([candidate])}>
                          {added ? "已加入" : "加入台账"}
                        </button>
                      </td>
                    </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="17" className="empty-cell">暂无AI解析结果。请上传PDF、DOCX或TXT简历并点击解析简历。</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CandidateLedgerTable({
  rows,
  emptyText,
  editingCandidateId,
  draft,
  onStartEdit,
  onDraftChange,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}) {
  const headers = [
    "编号",
    "候选人",
    "岗位",
    "部门",
    "城市",
    "渠道",
    "招聘负责人",
    "当前阶段",
    "投递日期",
    "入职日期",
    "淘汰/放弃原因",
    "操作",
  ];

  function input(field, type = "text") {
    return (
      <input
        className="ledger-edit-input"
        type={type}
        value={draft?.[field] || ""}
        onChange={(event) => onDraftChange(field, event.target.value)}
      />
    );
  }

  function select(field, options, normalizer = (value) => value) {
    const currentValue = draft?.[field] || "";
    return (
      <select
        className="ledger-edit-input"
        value={currentValue}
        onChange={(event) => onDraftChange(field, normalizer(event.target.value))}
      >
        {optionListWithCurrent(options, currentValue).map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  return (
    <div className="table-wrap candidate-ledger-wrap">
      <table>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((row) => {
              const isEditing = editingCandidateId === row.candidate_id;
              return (
                <tr key={row.candidate_id} className={isEditing ? "editing-row" : ""}>
                  <td>{row.candidate_id}</td>
                  <td>{isEditing ? input("name") : row.name}</td>
                  <td>{isEditing ? input("role") : row.role}</td>
                  <td>{isEditing ? input("department") : row.department}</td>
                  <td>{isEditing ? input("city") : row.city}</td>
                  <td>{isEditing ? select("source", SOURCE_OPTIONS, normalizeSource) : row.source}</td>
                  <td>{isEditing ? select("recruiter", RECRUITER_OPTIONS) : row.recruiter}</td>
                  <td>
                    {isEditing ? (
                      select("current_stage", STAGE_OPTIONS)
                    ) : (
                      <span className={stageClassName(row.current_stage)}>{displayStage(row.current_stage)}</span>
                    )}
                  </td>
                  <td>{isEditing ? input("applied_date", "date") : row.applied_date || "暂无"}</td>
                  <td>{isEditing ? input("hire_date", "date") : row.hire_date || "暂无"}</td>
                  <td>{isEditing ? input("reject_reason") : row.reject_reason || "暂无"}</td>
                  <td>
                    <div className="ledger-actions">
                      {isEditing ? (
                        <>
                          <button type="button" className="table-action save-action" onClick={() => onSaveEdit(row.candidate_id)}>
                            保存
                          </button>
                          <button type="button" className="table-action cancel-action" onClick={onCancelEdit}>
                            取消
                          </button>
                        </>
                      ) : (
                        <>
                          <button type="button" className="table-action edit-action" onClick={() => onStartEdit(row)}>
                            编辑
                          </button>
                          <button type="button" className="table-action delete-action" onClick={() => onDelete(row)}>
                            删除
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={headers.length} className="empty-cell">
                {emptyText}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function App() {
  const [rows, setRows] = useState(() => ensureUniqueCandidateIds(SAMPLE_ROWS));
  const [fileName, setFileName] = useState(SAMPLE_FILE_NAME);
  const [dataSource, setDataSource] = useState("系统示例数据");
  const [dataWarning, setDataWarning] = useState("");
  const [filters, setFilters] = useState({ role: "", source: "", recruiter: "", current_stage: "", search: "" });
  const [dateFilter, setDateFilter] = useState({ preset: "all", startDate: "", endDate: "" });
  const [copied, setCopied] = useState(false);
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [parsedCandidates, setParsedCandidates] = useState([]);
  const [localMessage, setLocalMessage] = useState("");
  const [editingCandidateId, setEditingCandidateId] = useState("");
  const [candidateDraft, setCandidateDraft] = useState(null);
  const [ledgerMessage, setLedgerMessage] = useState("");

  const dateFilteredRows = useMemo(() => filterRowsByAppliedDate(rows, dateFilter), [rows, dateFilter]);
  const analytics = useMemo(() => calculateAnalytics(dateFilteredRows), [dateFilteredRows]);
  const summary = useMemo(() => generateSummary(dateFilteredRows, analytics), [dateFilteredRows, analytics]);
  const bottleneckDiagnosis = useMemo(() => generateBottleneckDiagnosis(analytics), [analytics]);
  const sourceRecommendation = useMemo(() => generateSourceRecommendation(analytics), [analytics]);
  const roleInsight = useMemo(() => generateRoleInsight(analytics), [analytics]);
  const riskAlerts = useMemo(() => generateRiskAlerts(dateFilteredRows, analytics), [dateFilteredRows, analytics]);

  const filteredRows = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    return dateFilteredRows.filter((row) => {
      const matchesFilters = ["role", "source", "recruiter", "current_stage"].every(
        (key) => !filters[key] || row[key] === filters[key]
      );
      const matchesSearch =
        !search ||
        [row.candidate_id, row.name, row.city, row.department, row.reject_reason]
          .join(" ")
          .toLowerCase()
          .includes(search);
      return matchesFilters && matchesSearch;
    });
  }, [dateFilteredRows, filters]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedRows = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, pageSize, safeCurrentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [dateFilter, filters, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  function handleRowsLoaded(nextRows, nextFileName, warnings = [], sourceType = "upload") {
    setRows(ensureUniqueCandidateIds(prepareImportedRows(nextRows)));
    setFileName(nextFileName);
    setDataSource(sourceType === "sample" ? "系统示例数据" : "用户上传的候选人台账");
    setFilters({ role: "", source: "", recruiter: "", current_stage: "", search: "" });
    setDateFilter({ preset: "all", startDate: "", endDate: "" });
    setCurrentPage(1);
    setEditingCandidateId("");
    setCandidateDraft(null);
    setLedgerMessage("");
    setDataWarning(warnings.join(" "));
  }

  function addPipelineRows(parsedRows) {
    const existingKeys = ledgerDuplicateKeySet(rows);
    const addedParsed = [];
    const duplicateKeys = new Set();

    (Array.isArray(parsedRows) ? parsedRows : []).forEach((candidate) => {
      const key = parsedCandidateDuplicateKey(candidate);
      if (!key || existingKeys.has(key)) {
        duplicateKeys.add(key || candidate?.name || "duplicate");
        return;
      }

      existingKeys.add(key);
      addedParsed.push(candidate);
    });

    const preparedRows = ensureUniqueCandidateIds(
      prepareImportedRows(addedParsed.map(parsedCandidateToPipeline)),
      rows
    );

    if (preparedRows.length) {
      setRows((current) => [...current, ...preparedRows]);
      setDataSource("用户上传的候选人台账");
      setFileName("AI简历解析结果");
      setFilters({ role: "", source: "", recruiter: "", current_stage: "", search: "" });
      setDateFilter({ preset: "all", startDate: "", endDate: "" });
      setCurrentPage(1);
    }

    return {
      addedCount: preparedRows.length,
      duplicateCount: duplicateKeys.size,
      addedKeys: new Set(addedParsed.map(parsedCandidateDuplicateKey)),
      duplicateKeys,
    };
  }

  function startCandidateEdit(row) {
    setEditingCandidateId(row.candidate_id);
    setCandidateDraft({
      name: row.name || "",
      role: row.role || "",
      department: row.department || "",
      city: row.city || "",
      source: normalizeSource(row.source) || "",
      recruiter: row.recruiter || "",
      current_stage: displayStage(row.current_stage || "投递"),
      applied_date: normalizeDate(row.applied_date),
      hire_date: normalizeDate(row.hire_date),
      reject_reason: row.reject_reason || "",
    });
    setLedgerMessage("");
  }

  function updateCandidateDraft(field, value) {
    setCandidateDraft((current) => ({ ...(current || {}), [field]: value }));
  }

  function cancelCandidateEdit() {
    setEditingCandidateId("");
    setCandidateDraft(null);
    setLedgerMessage("");
  }

  function saveCandidateEdit(candidateId) {
    if (!candidateDraft) return;

    const appliedDateText = String(candidateDraft.applied_date || "").trim();
    const hireDateText = String(candidateDraft.hire_date || "").trim();
    const appliedDate = normalizeDate(appliedDateText);
    const hireDate = normalizeDate(hireDateText);

    if (appliedDateText && !appliedDate) {
      setLedgerMessage("投递日期格式无法识别，请使用YYYY-MM-DD格式。");
      return;
    }

    if (hireDateText && !hireDate) {
      setLedgerMessage("入职日期格式无法识别，请使用YYYY-MM-DD格式。");
      return;
    }

    const nextValues = {
      name: String(candidateDraft.name || "").trim() || "Candidate 待确认",
      role: String(candidateDraft.role || "").trim() || "待人工确认",
      department: String(candidateDraft.department || "").trim() || inferDepartment(candidateDraft.role),
      city: String(candidateDraft.city || "").trim() || "待确认",
      source: normalizeSource(candidateDraft.source) || "待确认",
      recruiter: String(candidateDraft.recruiter || "").trim() || SAMPLE_RECRUITERS[0],
      current_stage: displayStage(candidateDraft.current_stage || "投递"),
      applied_date: appliedDate,
      hire_date: hireDate,
      reject_reason: String(candidateDraft.reject_reason || "").trim(),
    };

    setRows((current) =>
      current.map((row) => (row.candidate_id === candidateId ? { ...row, ...nextValues } : row))
    );
    setEditingCandidateId("");
    setCandidateDraft(null);
    setLedgerMessage("已保存候选人记录，招聘漏斗数据已更新。");
  }

  function deleteCandidate(row) {
    const confirmed = window.confirm("确认删除该候选人记录吗？删除后将重新计算招聘漏斗数据。");
    if (!confirmed) return;

    setRows((current) => current.filter((candidate) => candidate.candidate_id !== row.candidate_id));
    if (editingCandidateId === row.candidate_id) {
      setEditingCandidateId("");
      setCandidateDraft(null);
    }
    setLedgerMessage("已删除候选人记录，招聘漏斗数据已重新计算。");
  }

  function saveLocalData(currentRows) {
    localStorage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify({
        rows: currentRows,
        fileName,
        dataSource,
        parsedCandidates,
        savedAt: new Date().toISOString(),
      })
    );
    setLocalMessage("已保存当前数据到浏览器本地。");
  }

  function loadLocalData() {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!saved) {
      setLocalMessage("暂无本地保存数据。");
      return;
    }

    try {
      const parsed = JSON.parse(saved);
      handleRowsLoaded(prepareImportedRows(parsed.rows || []), parsed.fileName || "本地保存数据", [], "upload");
      setDataSource(parsed.dataSource || "用户上传的候选人台账");
      setParsedCandidates((parsed.parsedCandidates || []).map(normalizeParsedCandidate));
      setLocalMessage("已读取本地保存数据。");
    } catch (error) {
      setLocalMessage("本地保存数据读取失败，请清空后重新保存。");
    }
  }

  function clearLocalData() {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setLocalMessage("已清空本地保存数据。");
  }

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(summary);
    } catch (error) {
      const textarea = document.createElement("textarea");
      textarea.value = summary;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  const stageColumns = [
    { key: "from", label: "起始阶段" },
    { key: "to", label: "目标阶段" },
    { key: "candidates", label: "候选人数" },
    { key: "progressed", label: "进入下一阶段" },
    { key: "conversion", label: "转化率", render: (row) => formatPct(row.conversion) },
  ];

  const sourceColumns = [
    { key: "source", label: "渠道" },
    { key: "applications", label: "投递人数" },
    { key: "interviews", label: "面试人数" },
    { key: "offers", label: "Offer人数" },
    { key: "hires", label: "入职人数" },
    { key: "hireRate", label: "入职转化率", render: (row) => formatPct(row.hireRate) },
  ];

  const roleColumns = [
    { key: "role", label: "岗位" },
    { key: "applications", label: "投递人数" },
    { key: "interviews", label: "面试人数" },
    { key: "offers", label: "Offer人数" },
    { key: "hires", label: "入职人数" },
    {
      key: "avgTimeToHire",
      label: "平均招聘周期",
      render: (row) => (row.avgTimeToHire === null ? "暂无" : `${row.avgTimeToHire.toFixed(1)}天`),
    },
  ];

  return (
    <main>
      <UploadPanel onRowsLoaded={handleRowsLoaded} fileName={fileName} error={dataWarning} dataSource={dataSource} />

      <DataWorkflowPanel
        rows={rows}
        onRowsLoaded={handleRowsLoaded}
        onSaveLocal={saveLocalData}
        onLoadLocal={loadLocalData}
        onClearLocal={clearLocalData}
        localMessage={localMessage}
      />

      <ResumeParserPanel
        parsedCandidates={parsedCandidates}
        setParsedCandidates={setParsedCandidates}
        onAddCandidates={addPipelineRows}
        ledgerRows={rows}
      />

      <DateRangeFilter
        dateFilter={dateFilter}
        rows={rows}
        filteredCount={dateFilteredRows.length}
        onChange={setDateFilter}
      />

      <section className="stat-grid" aria-label="概览看板">
        <StatCard
          icon="人"
          label="候选人总数"
          value={analytics.totalCandidates}
          note={`${analytics.activeCandidates}条有效记录`}
          description="当前筛选条件下的候选人记录数量"
        />
        <StatCard
          icon="率"
          label="总体入职率"
          value={formatPct(analytics.overallHireRate)}
          note={`${analytics.hiredCount}人入职`}
          description="入职人数 / 投递人数"
        />
        <StatCard
          icon="天"
          label="平均招聘周期"
          value={analytics.avgTimeToHire === null ? "暂无" : `${analytics.avgTimeToHire.toFixed(1)}天`}
          note="从投递到入职"
          description="从投递到入职的平均天数"
        />
        <StatCard
          icon="聘"
          label="Offer人数"
          value={analytics.offerCount}
          note={`${formatPct(pct(analytics.offerCount, analytics.totalCandidates))} Offer转化率`}
          description="已进入Offer阶段的候选人数量"
        />
      </section>

      <section className="summary-card">
        <div className="summary-header">
          <div>
            <span className="eyebrow">HR周报摘要</span>
            <h2>自动生成摘要</h2>
          </div>
          <div className="copy-wrap">
            <button type="button" className="copy-button" onClick={copySummary}>复制HR周报</button>
            {copied ? <span className="copy-toast">已复制到剪贴板</span> : null}
          </div>
        </div>
        <div>
          <p>{summary}</p>
          <p className="analysis-note">以上分析基于当前筛选条件下的候选人台账自动生成，仅用于辅助HR判断。</p>
        </div>
      </section>

      <section className="panel risk-panel">
        <div className="panel-header">
          <div>
            <span className="eyebrow">重点风险提醒</span>
            <h2>自动识别招聘风险</h2>
          </div>
        </div>
        <ul className="risk-list">
          {riskAlerts.map((alert) => (
            <li key={alert}>{alert}</li>
          ))}
        </ul>
        <p className="analysis-note">以上分析基于当前筛选条件下的候选人台账自动生成，仅用于辅助HR判断。</p>
      </section>

      <section className="grid two-col">
        <article className="panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">招聘漏斗</span>
              <h2>各阶段人数</h2>
            </div>
          </div>
          <div className="chart-area">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.stageData} margin={{ top: 22, right: 12, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="stage" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="count" name="人数" radius={[6, 6, 0, 0]}>
                  <LabelList dataKey="count" position="top" />
                  {analytics.stageData.map((entry, index) => (
                    <Cell key={entry.stage} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">阶段流转</span>
              <h2>阶段转化率</h2>
            </div>
          </div>
          <DataTable columns={stageColumns} rows={analytics.conversionData} />
        </article>
      </section>

      <section className="grid two-col source-section">
        <article className="panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">渠道质量</span>
              <h2>渠道效果分析</h2>
            </div>
          </div>
          <DataTable columns={sourceColumns} rows={analytics.sourceData} />
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">从投递到入职</span>
              <h2>渠道表现</h2>
            </div>
          </div>
          <div className="chart-area">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.sourceData} margin={{ top: 16, right: 12, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="source" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="applications" name="投递" fill={SOURCE_COLORS.applications} radius={[6, 6, 0, 0]} />
                <Bar dataKey="interviews" name="面试" fill={SOURCE_COLORS.interviews} radius={[6, 6, 0, 0]} />
                <Bar dataKey="offers" name="Offer" fill={SOURCE_COLORS.offers} radius={[6, 6, 0, 0]} />
                <Bar dataKey="hires" name="入职" fill={SOURCE_COLORS.hires} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <span className="eyebrow">招聘需求</span>
            <h2>岗位分析</h2>
          </div>
        </div>
        <p className="role-insight">{roleInsight}</p>
        <DataTable columns={roleColumns} rows={analytics.roleData} />
      </section>

      <section className="grid two-col">
        <article className="panel insight-panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">招聘瓶颈诊断</span>
              <h2>最大流失环节</h2>
            </div>
          </div>
          <p>{bottleneckDiagnosis}</p>
          <p className="analysis-note">以上分析基于当前筛选条件下的候选人台账自动生成，仅用于辅助HR判断。</p>
        </article>

        <article className="panel insight-panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">渠道效果建议</span>
              <h2>渠道质量与规模</h2>
            </div>
          </div>
          <p>{sourceRecommendation}</p>
          <p className="analysis-note">以上分析基于当前筛选条件下的候选人台账自动生成，仅用于辅助HR判断。</p>
        </article>
      </section>

      <section className="panel">
        <div className="panel-header pipeline-header">
          <div>
            <span className="eyebrow">候选人记录</span>
            <h2>候选人流程台账</h2>
          </div>
          <div className="result-count">{filteredRows.length}条显示</div>
        </div>
        <div className="filters">
          <div className="search-box">
            <span className="search-icon">搜索</span>
            <input
              value={filters.search}
              placeholder="搜索候选人"
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
            />
          </div>
          <FilterSelect
            label="岗位"
            value={filters.role}
            options={uniqueOptions(dateFilteredRows, "role")}
            onChange={(value) => setFilters((current) => ({ ...current, role: value }))}
          />
          <FilterSelect
            label="渠道"
            value={filters.source}
            options={uniqueOptions(dateFilteredRows, "source")}
            onChange={(value) => setFilters((current) => ({ ...current, source: value }))}
          />
          <FilterSelect
            label="招聘负责人"
            value={filters.recruiter}
            options={uniqueOptions(dateFilteredRows, "recruiter")}
            onChange={(value) => setFilters((current) => ({ ...current, recruiter: value }))}
          />
          <FilterSelect
            label="当前阶段"
            value={filters.current_stage}
            options={uniqueOptions(dateFilteredRows, "current_stage")}
            onChange={(value) => setFilters((current) => ({ ...current, current_stage: value }))}
          />
          <button type="button" className="clear-button" onClick={() => setFilters({ role: "", source: "", recruiter: "", current_stage: "", search: "" })}>
            <span className="button-icon">重置</span>
            清空
          </button>
        </div>
        {ledgerMessage ? (
          <p className={ledgerMessage.includes("无法") ? "warning-text" : "success-text"}>{ledgerMessage}</p>
        ) : null}
        <CandidateLedgerTable
          rows={paginatedRows}
          emptyText="没有候选人符合当前筛选条件。"
          editingCandidateId={editingCandidateId}
          draft={candidateDraft}
          onStartEdit={startCandidateEdit}
          onDraftChange={updateCandidateDraft}
          onSaveEdit={saveCandidateEdit}
          onCancelEdit={cancelCandidateEdit}
          onDelete={deleteCandidate}
        />
        <div className="pagination-bar">
          <label className="page-size-control">
            <span>每页显示</span>
            <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </label>
          <div className="pagination-status">
            第{safeCurrentPage}页 / 共{totalPages}页，共{filteredRows.length}条
          </div>
          <div className="pagination-actions">
            <button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={safeCurrentPage <= 1}>
              上一页
            </button>
            <button type="button" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={safeCurrentPage >= totalPages}>
              下一页
            </button>
          </div>
        </div>
      </section>

      <section className="panel about-panel">
        <div className="panel-header">
          <div>
            <span className="eyebrow">关于本项目</span>
            <h2>项目说明</h2>
          </div>
        </div>
        <p>
          本项目是一个轻量级 HR 招聘数据工作台，支持 Excel/CSV 候选人台账上传、Excel 表格粘贴导入、AI 简历解析、候选人台账生成、本地数据保存、招聘漏斗分析、阶段转化率计算、渠道效果分析、岗位招聘周期分析、风险提醒和 HR 周报摘要生成。该工具用于支持 HR 数据整理与招聘复盘，不用于自动筛选、排序、淘汰或录用候选人。本项目由 Wenkai Zhu 独立设计与开发，旨在展示 HR 数据分析、招聘流程理解和 AI 辅助编程能力。
        </p>
      </section>

      <footer>© 2026 Wenkai Zhu. Recruiting Funnel Analyzer / 招聘漏斗分析仪.</footer>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
