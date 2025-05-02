// @ts-nocheck
import { Project, SyntaxKind, ParameterDeclarationStructure, StructureKind } from 'ts-morph';
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

  // 2. Ensure Pino imports
  let pinoImport = sourceFile.getImportDeclaration(d => d.getModuleSpecifierValue() === 'nestjs-pino');
  if (!pinoImport) {
    sourceFile.insertImportDeclaration(0, {
      moduleSpecifier: 'nestjs-pino',
      namedImports: ['PinoLogger', 'InjectPinoLogger'],
    });
  } else {
    const existing = pinoImport.getNamedImports().map(n => n.getName());
    ['PinoLogger', 'InjectPinoLogger'].forEach(name => {
      if (!existing.includes(name)) pinoImport!.addNamedImport(name);
    });
  }

  // 3. Update classes: remove old Logger props, inject PinoLogger
  sourceFile.getClasses().forEach(cls => {
    const className = cls.getName() || '';
    cls.getInstanceProperties().forEach(prop => {
      if (prop.getText().includes('new Logger(')) prop.remove();
    });
    let ctor = cls.getConstructors()[0];
    if (!ctor) ctor = cls.addConstructor({ parameters: [], statements: [] });
    const hasLogger = ctor.getParameters().some(p => p.getName() === 'logger');
    if (!hasLogger) {
      ctor.insertParameter(0, <ParameterDeclarationStructure>{
        kind: StructureKind.Parameter,
        name: 'logger',
        type: 'PinoLogger',
        scope: 1,
        isReadonly: true,
        decorators: [{ name: 'InjectPinoLogger', arguments: [`${className}.name`] }],
      });
    }
  });

  // 4. Replace console.log → this.logger.debug
  sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression).forEach(call => {
    if (call.getExpression().getText() === 'console.log') call.getExpression().replaceWithText('this.logger.debug');
  });
}

project.save().then(() => console.log('Ponno codemod applied.')).catch(console.error);
