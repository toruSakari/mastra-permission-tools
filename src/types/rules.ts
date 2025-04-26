import { SecurityLevel } from './security';

export type ParameterCondition = 
  | 'equals' 
  | 'contains' 
  | 'startsWith' 
  | 'endsWith' 
  | 'regex' 
  | 'greaterThan' 
  | 'lessThan';

export interface ParameterRule {
  param: string;
  condition: ParameterCondition;
  value: any;
  securityLevel?: SecurityLevel;
  message?: string;
}