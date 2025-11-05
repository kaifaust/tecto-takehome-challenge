# Tecto Evaluation Metrics

This document defines the six metrics used to benchmark AI contract understanding tools.

## Overview

Each extracted contract is evaluated across **six dimensions** that measure both the quality of extraction and the performance characteristics of the AI system.

---

## 1. Relevance

**Definition:** How well the extracted information addresses the core business value of the contract.

**Measurement:**
- Are the `keyObligations` the most critical terms (SLAs, financial commitments, compliance requirements)?
- Does the `subjectMatter` capture the essence of what the contract is about?
- Are extracted parties and dates the legally binding entities and dates, not procedural mentions?

**Scoring:**
- **1.0 (Perfect):** All extracted fields represent the most important contract elements
- **0.7-0.9 (Good):** Mostly critical information with some minor details included
- **0.4-0.6 (Moderate):** Mix of important and trivial information
- **0.0-0.3 (Poor):** Focuses on procedural details, misses critical business terms

**Example:**
- ✅ **Relevant:** "99.99% uptime SLA with tiered service credits"
- ❌ **Not Relevant:** "Notices shall be sent via certified mail"

---

## 2. Fluency

**Definition:** The grammatical correctness, readability, and professional quality of extracted text.

**Measurement:**
- Are sentences grammatically correct and complete?
- Is the language clear and professional?
- Are there formatting errors, truncated sentences, or garbled text?

**Scoring:**
- **1.0 (Perfect):** Professional, grammatically correct, well-structured text
- **0.7-0.9 (Good):** Minor grammatical issues that don't impede understanding
- **0.4-0.6 (Moderate):** Noticeable errors or awkward phrasing
- **0.0-0.3 (Poor):** Fragmented, ungrammatical, or incomprehensible text

**Example:**
- ✅ **Fluent:** "Provider furnishes enterprise-grade cloud infrastructure to Customer, a multinational banking institution."
- ❌ **Not Fluent:** "Provider furnish cloud for Customer bank institution global."

---

## 3. Helpfulness

**Definition:** The actionable value of the extraction for downstream business use cases.

**Measurement:**
- Can a contract manager identify renewal dates and financial commitments?
- Can a compliance officer assess regulatory obligations?
- Can a legal team identify key risks and liabilities?
- Is the information structured in a way that supports decision-making?

**Scoring:**
- **1.0 (Perfect):** Extraction enables immediate business action and risk assessment
- **0.7-0.9 (Good):** Useful information with minor gaps
- **0.4-0.6 (Moderate):** Some useful information but requires additional document review
- **0.0-0.3 (Poor):** Extraction provides little actionable insight

**Example:**
- ✅ **Helpful:** Extracting "RTO of 4 hours and RPO of 15 minutes" (enables DR planning)
- ❌ **Not Helpful:** Extracting only "Disaster recovery terms are included" (no specifics)

---

## 4. Correctness

**Definition:** The factual accuracy of extracted information compared to ground truth.

**Measurement:**

### Exact Match Fields (Binary: 1.0 or 0.0)
- `contractId`, `effectiveDate`, `expirationDate`: Must match exactly
- `title`: Minor formatting differences acceptable (capitalization, punctuation)
- `parties`: All parties must be present with correct legal names

### Semantic Similarity Fields (0.0-1.0)
- `subjectMatter`, `keyObligations`: Scored using semantic similarity (cosine similarity of embeddings)
  - **0.95-1.0:** Semantically identical or near-identical
  - **0.85-0.94:** Captures same meaning with different wording
  - **0.70-0.84:** Similar meaning but missing some nuance
  - **< 0.70:** Incorrect or significantly different

### Structured Fields
- `contractValue`: Correct total, currency, and major components
- `contractDuration`: Correct term length (exact match for numbers)

**Scoring:**
- Aggregate correctness = weighted average of all field scores
- Critical fields (dates, IDs, parties) have 2x weight

---

## 5. Groundedness

**Definition:** Whether extracted information is directly traceable to the source document (no hallucinations).

**Measurement:**
- Can every extracted field value be cited to a specific section in the contract?
- Are there any fabricated numbers, dates, or terms not present in the source?
- Are inferences clearly documented (e.g., calculating expiration date from effective date + duration)?

**Scoring:**
- **1.0 (Perfect):** All information directly present in source or properly calculated from source
- **0.9 (Near Perfect):** Minor paraphrasing but faithful to source
- **0.6-0.8 (Moderate):** Some unsupported claims or overgeneralizations
- **0.0-0.5 (Poor):** Significant hallucinations or fabricated information

**Validation Method:**
- Human reviewer checks each extracted field against source document
- Flag any value that cannot be directly cited
- Flag any "reasonable inference" that could be incorrect

**Example:**
- ✅ **Grounded:** Extracting "Three (3) Years" when document states "initial term of three (3) years"
- ❌ **Not Grounded:** Extracting "$10M total value" when document only lists monthly fees without stating total

---

## 6. Latency

**Definition:** The end-to-end time to process a contract and return structured extraction results.

**Measurement:**
- **p50 (median):** 50th percentile latency across all samples
- **p90:** 90th percentile latency (captures tail performance)
- **p99:** 99th percentile latency (identifies worst-case scenarios)

**Timing Methodology:**
```
start_time = timestamp before API call
response = await extract_contract(document)
end_time = timestamp after response received
latency_ms = end_time - start_time
```

**Target Benchmarks:**
- **< 5 seconds:** Excellent (real-time experience)
- **5-15 seconds:** Good (acceptable for batch processing)
- **15-30 seconds:** Moderate (batch-only workflows)
- **> 30 seconds:** Poor (user friction)

**Considerations:**
- Document length (contracts are 1-2 pages / ~8000 tokens)
- API cold start vs. warm performance
- Network latency (should be measured from same geographic region)

---

## Aggregate Scoring

**Overall Quality Score (OQS):**
```
OQS = (Relevance × 0.20) +
      (Fluency × 0.15) +
      (Helpfulness × 0.20) +
      (Correctness × 0.30) +
      (Groundedness × 0.15)
```

**Weights Rationale:**
- **Correctness (30%):** Most critical - wrong information is worse than no information
- **Relevance (20%):** Important - extracting the right information matters
- **Helpfulness (20%):** Important - extraction must be actionable
- **Fluency (15%):** Moderate - quality matters but less than accuracy
- **Groundedness (15%):** Moderate - prevents hallucinations

**Latency** is reported separately as it doesn't affect quality but impacts user experience.

---

## Traffic Light Status

For easy visualization, each metric and overall score maps to a color:

- 🟢 **Green (Good):** Score ≥ 0.85
- 🟡 **Yellow (Moderate):** Score 0.65 - 0.84
- 🔴 **Red (Poor):** Score < 0.65

---

## Evaluation Process

1. **Extract:** Run both APIs (Extracta.ai and Azure) on each sample contract
2. **Normalize:** Map API responses to unified schema
3. **Score:** Calculate each of the 6 metrics per sample
4. **Aggregate:** Calculate mean scores across all samples
5. **Report:** Generate comparison report with traffic light indicators

---

## Example Evaluation Output

```json
{
  "sample_id": "01",
  "tool": "extracta",
  "metrics": {
    "relevance": 0.92,
    "fluency": 0.88,
    "helpfulness": 0.90,
    "correctness": 0.85,
    "groundedness": 0.95,
    "latency_ms": 4200
  },
  "overall_quality_score": 0.89,
  "status": "🟢 Good"
}
```
