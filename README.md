# RealTime Recommendation Agent
Team Syncers @ Vetsource Hackathon 2026

# Real-Time Recommendation Agent

> Closes the gap between clinical nutrition recommendations and client purchases — right at checkout, while the patient is still in the practice.

![Hackathon](https://img.shields.io/badge/Tech%20Summit%20Hackathon-2026-blue) ![Domain](https://img.shields.io/badge/Veterinary-POS-green) ![Type](https://img.shields.io/badge/AI--Powered-Agent-amber)

---

## The Problem

Weight management recommendations made in the exam room routinely fail to convert at the front desk. Without a data-driven prompt at the Point of Sale, clients leave without prescribed nutrition products — costing the practice pharmacy revenue and leaving patients without the care they need.

---

## How It Works

1. **Patient data ingested in real time**  
   Weight, age, species, and breed are pulled from the PIMS during checkout.

2. **Agent determines if patient is overweight**  
   Based on species- and breed-specific benchmarks.

3. **Relevant diet products are recommended**  
   Filtered against purchase history so nothing already owned is surfaced.

4. **Popup surfaces on the workstation**  
   Vet or practice tech reviews the list with the client still present.

5. **One-click add to order + optional autoship**  
   If the client agrees, the product is added to the current transaction immediately.

---

## Validation Checks

Before surfacing any recommendations, the agent verifies:

| Source | Check |
|---|---|
| **Vetsource** | Filters out products the client has already purchased through prior order history |
| **PIMS (live)** | Checks real-time transactions to avoid recommending items already in today's order |

---

## Outcome

The right product, surfaced at the right moment — pre-filled with client and patient details, ready to add to the order. Better compliance for the patient. Better revenue for the practice.

---

*Built at Tech Summit Hackathon 2026 · Real-Time Recommendation Agent*
