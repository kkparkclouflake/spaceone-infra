import * as cdk from '@aws-cdk/core';
import * as eks from '@aws-cdk/aws-eks';
import * as iam from '@aws-cdk/aws-iam'

import * as yaml from 'js-yaml';

import * as fs from 'fs';

import { EksProps } from '../props/eks-props'
import { DomainProps } from '../props/domain-props';

let domain = 'aws.sonnada.me'

export class ExternalDnsDeploy extends cdk.Construct {
    constructor(scope: cdk.Construct, id: string, eks: EksProps, domain: DomainProps) {
        super(scope, id);

        // Load IAM Policy from file
        let iamPolicyDocument = JSON.parse(fs.readFileSync('./res/iam/policies/external-dns-route53-iam-policy.json').toString());
    
        // yaml 파일 로드
        let dataResult: Record<string, object>[] = [];

        try {
            let valuesYaml = fs.readFileSync('./res/kubernetes/manifests/external-dns.yaml');
            // Replace Domain and load YAML
            let valuesParsed = yaml.loadAll(valuesYaml.toString().replace('{DOMAIN_FILTER}', domain.domainName));
            if (typeof valuesParsed === 'object' && valuesParsed !== null) {
                dataResult = valuesParsed as Record<string, object>[];
            }
        } catch (exception) {
            // pass
            console.error(" > Failed to load 'external-dns.yaml' for 'external-dns' deploy...");
            console.error(exception);
            return;
        }

        // Create Kubernetes ServiceAccount
        let svcAccount = eks.cluster.addServiceAccount('external-dns', {
            name: 'external-dns',
            namespace: 'kube-system',
        });

        // Create IAM Policy
        const iamPolicy = new iam.Policy(scope, 'AllowExternalDNSUpdatesIAMPolicy', {
            policyName: 'AllowExternalDNSUpdatesIAMPolicy',
            document: iam.PolicyDocument.fromJson(iamPolicyDocument),
        })

        // Attach IAM role
        svcAccount.role.attachInlinePolicy(iamPolicy);

        // Install External DNS
        dataResult.forEach(function(val, idx) {
            eks.cluster.addManifest('external-dns-' + idx, val);
        });
    }
}