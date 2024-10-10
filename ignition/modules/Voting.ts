import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const CANDIDATES = ["Bob", "Alice"];

const VotingModule = buildModule("VotingModule", (m) => {

  const candidates = m.getParameter("_candidate_names", CANDIDATES);

  const voting = m.contract("Voting", [candidates]);

  return { voting };
});

export default VotingModule;
