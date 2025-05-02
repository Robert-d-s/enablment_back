// @ts-nocheck
import { Project, SyntaxKind, ParameterDeclarationStructure, StructureKind, Scope } from 'ts-morph';
import * as path from 'path';

// Initialize ts-morph project
const project = new Project({
  tsConfigFilePath: path.resolve(__dirname, './tsconfig.json'),
});
project.addSourceFilesAtPaths('src/**/*.ts');

for (const sourceFile of project.getSourceFiles()) {
  const filePath = sourceFile.getFilePath();
  if (filePath.endsWith('ponnoCodemod.ts')) continue;

  // 1. Remove Nest's Logger import
  const commonImport = sourceFile.getImportDeclaration(d => d.getModuleSpecifierValue() === '@nestjs/common');
  if (commonImport) {
    const loggerNamed = commonImport.getNamedImports().find(n => n.getName() === 'Logger');
    if (loggerNamed) {
      if (commonImport.getNamedImports().length > 1) loggerNamed.remove();
      else commonImport.remove();
    }
  }

  // 2. Only add Pino logger where console.log is used
  const hasLogs = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression)
    .some((call: any) => call.getExpression().getText() === 'console.log');
  if (hasLogs) {
    // a) Ensure Pino imports
    let pinoImport = sourceFile.getImportDeclaration((d: any) =>
      d.getModuleSpecifierValue() === 'nestjs-pino'
    );
    if (!pinoImport) {
      sourceFile.insertImportDeclaration(0, {
        moduleSpecifier: 'nestjs-pino',
        namedImports: ['PinoLogger', 'InjectPinoLogger'],
      });
    } else {
      const existing = pinoImport.getNamedImports().map((n: any) => n.getName());
      ['PinoLogger', 'InjectPinoLogger'].forEach(name => {
        if (!existing.includes(name)) pinoImport!.addNamedImport(name);
      });
    }
    // b) Inject PinoLogger in classes
    sourceFile.getClasses().forEach((cls: any) => {
      const className = cls.getName() || '';
      cls.getInstanceProperties().forEach((prop: any) => {
        if (prop.getText().includes('new Logger(')) prop.remove();
      });
      let ctor: any | undefined = cls.getConstructors()[0];
      if (!ctor) ctor = cls.addConstructor({ parameters: [], statements: [] });
      const hasLogger = ctor.getParameters().some(p => p.getName() === 'logger');
      if (!hasLogger) {
        ctor.insertParameter(0, <ParameterDeclarationStructure>{
          kind: StructureKind.Parameter,
          name: 'logger',
          type: 'PinoLogger',
          scope: Scope.Private,
          isReadonly: true,
          decorators: [{ name: 'InjectPinoLogger', arguments: [`${className}.name`] }],
        });
      }
    });
  }

  // 4. Replace console.log → this.logger.debug
  sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression).forEach(call => {
    if (call.getExpression().getText() === 'console.log') call.getExpression().replaceWithText('this.logger.debug');
  });
}

project.save().then(() => console.log('Ponno codemod applied.')).catch(console.error);
